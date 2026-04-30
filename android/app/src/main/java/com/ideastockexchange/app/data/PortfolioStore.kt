package com.ideastockexchange.app.data

import android.content.Context
import com.ideastockexchange.app.model.Action
import com.ideastockexchange.app.model.Portfolio
import com.ideastockexchange.app.model.Position
import com.ideastockexchange.app.model.Side
import com.ideastockexchange.app.model.TradeEvent
import com.ideastockexchange.app.model.unrealizedPnL
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.json.Json
import java.io.File
import java.util.UUID

// Persists the user's $10k trading game state to a single JSON file. Single
// instance per process — call PortfolioStore.get(context) to share across
// ViewModels. Reads/writes are guarded by a coroutine mutex; the JSON file is
// rewritten atomically (temp file + rename) so a crash mid-write can't leave
// a half-serialized blob.
class PortfolioStore private constructor(
    private val file: File,
) {
    private val json = Json {
        ignoreUnknownKeys = true
        prettyPrint = false
        encodeDefaults = true
    }
    private val mutex = Mutex()
    private val _state = MutableStateFlow(loadFromDisk())
    val state: StateFlow<Portfolio> = _state.asStateFlow()

    private fun loadFromDisk(): Portfolio = try {
        if (file.exists()) json.decodeFromString(Portfolio.serializer(), file.readText())
        else Portfolio()
    } catch (_: Throwable) {
        Portfolio()
    }

    private fun persist(portfolio: Portfolio) {
        val tmp = File(file.parentFile, file.name + ".tmp")
        tmp.writeText(json.encodeToString(Portfolio.serializer(), portfolio))
        if (!tmp.renameTo(file)) {
            file.writeText(json.encodeToString(Portfolio.serializer(), portfolio))
            tmp.delete()
        }
    }

    suspend fun reset() = mutex.withLock {
        val fresh = Portfolio()
        persist(fresh)
        _state.value = fresh
    }

    suspend fun openPosition(
        beliefId: Int,
        statement: String,
        side: Side,
        shares: Int,
        price: Double,
        nowMillis: Long = System.currentTimeMillis(),
    ): TradeResult = mutex.withLock {
        if (shares <= 0) return@withLock TradeResult.Error("Enter at least 1 share.")
        if (price <= 0.0) return@withLock TradeResult.Error("This belief doesn't have a tradeable price yet.")
        val cost = shares * price
        val current = _state.value
        if (cost > current.cash) {
            return@withLock TradeResult.Error(
                "Not enough cash. Need $${"%.2f".format(cost)}, have $${"%.2f".format(current.cash)}."
            )
        }
        val newPosition = Position(
            id = UUID.randomUUID().toString(),
            beliefId = beliefId,
            statement = statement,
            side = side,
            shares = shares,
            openPrice = price,
            openedAtMillis = nowMillis,
        )
        val event = TradeEvent(
            timestampMillis = nowMillis,
            beliefId = beliefId,
            statement = statement,
            side = side,
            action = Action.OPEN,
            shares = shares,
            price = price,
        )
        val next = current.copy(
            cash = current.cash - cost,
            positions = current.positions + newPosition,
            history = (current.history + event).takeLast(MAX_HISTORY),
        )
        persist(next)
        _state.value = next
        TradeResult.Ok(newPosition)
    }

    suspend fun closePosition(
        positionId: String,
        markPrice: Double,
        nowMillis: Long = System.currentTimeMillis(),
    ): TradeResult = mutex.withLock {
        val current = _state.value
        val position = current.positions.firstOrNull { it.id == positionId }
            ?: return@withLock TradeResult.Error("That position is no longer open.")
        if (markPrice <= 0.0) return@withLock TradeResult.Error("No live price to close at.")

        val proceeds = when (position.side) {
            Side.LONG -> position.shares * markPrice
            // Shorts: return the collateral + the price decline.
            Side.SHORT -> position.shares * (2 * position.openPrice - markPrice)
        }
        val realized = position.unrealizedPnL(markPrice)
        val event = TradeEvent(
            timestampMillis = nowMillis,
            beliefId = position.beliefId,
            statement = position.statement,
            side = position.side,
            action = Action.CLOSE,
            shares = position.shares,
            price = markPrice,
            realizedPnL = realized,
        )
        val next = current.copy(
            cash = current.cash + proceeds,
            positions = current.positions.filterNot { it.id == positionId },
            realizedPnL = current.realizedPnL + realized,
            history = (current.history + event).takeLast(MAX_HISTORY),
        )
        persist(next)
        _state.value = next
        TradeResult.Closed(realized)
    }

    sealed interface TradeResult {
        data class Ok(val position: Position) : TradeResult
        data class Closed(val realizedPnL: Double) : TradeResult
        data class Error(val message: String) : TradeResult
    }

    companion object {
        private const val MAX_HISTORY = 200
        @Volatile private var instance: PortfolioStore? = null

        fun get(context: Context): PortfolioStore {
            instance?.let { return it }
            return synchronized(this) {
                instance ?: PortfolioStore(
                    File(context.applicationContext.filesDir, "portfolio.json")
                ).also { instance = it }
            }
        }
    }
}
