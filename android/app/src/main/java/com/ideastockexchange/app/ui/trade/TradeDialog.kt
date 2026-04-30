package com.ideastockexchange.app.ui.trade

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.ideastockexchange.app.model.Side
import com.ideastockexchange.app.ui.theme.ConRed
import com.ideastockexchange.app.ui.theme.ProGreen

@Composable
fun TradeDialog(
    statement: String,
    side: Side,
    pricePerShare: Double,
    cashAvailable: Double,
    onDismiss: () -> Unit,
    onConfirm: (shares: Int) -> Unit,
) {
    var sharesText by remember { mutableStateOf("1") }
    val shares = sharesText.toIntOrNull()?.coerceAtLeast(0) ?: 0
    val cost = shares * pricePerShare
    val tint = if (side == Side.LONG) ProGreen else ConRed
    val verb = if (side == Side.LONG) "Buy" else "Short"
    val rationale = if (side == Side.LONG)
        "You think this idea is underrated and its score will rise."
    else
        "You think this idea is overrated and its score will fall."
    val canConfirm = shares > 0 && cost <= cashAvailable && pricePerShare > 0.0

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(onClick = { if (canConfirm) onConfirm(shares) }, enabled = canConfirm) {
                Text("$verb $shares share${if (shares == 1) "" else "s"}", color = tint, fontWeight = FontWeight.SemiBold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        },
        title = { Text("$verb position") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = statement,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(rationale, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.secondary)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(tint.copy(alpha = 0.10f))
                        .padding(10.dp),
                ) {
                    KeyValue(label = "Price / share", value = "$${"%.2f".format(pricePerShare)}", modifier = Modifier.weight(1f))
                    KeyValue(label = "Cash", value = "$${"%.2f".format(cashAvailable)}", modifier = Modifier.weight(1f))
                }
                OutlinedTextField(
                    value = sharesText,
                    onValueChange = { sharesText = it.filter { ch -> ch.isDigit() }.take(6) },
                    label = { Text("Shares") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                )
                val capacity = if (pricePerShare > 0) (cashAvailable / pricePerShare).toInt() else 0
                Text(
                    "Cost: $${"%.2f".format(cost)} • Max affordable: $capacity",
                    style = MaterialTheme.typography.labelSmall,
                    color = if (cost > cashAvailable) ConRed else MaterialTheme.colorScheme.secondary,
                )
            }
        },
    )
}

@Composable
private fun KeyValue(label: String, value: String, modifier: Modifier = Modifier) {
    Column(modifier = modifier) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
        Text(value, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
    }
}
