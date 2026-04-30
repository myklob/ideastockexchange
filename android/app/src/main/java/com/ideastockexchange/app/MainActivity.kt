package com.ideastockexchange.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Leaderboard
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.ShowChart
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.ideastockexchange.app.ui.detail.BeliefDetailScreen
import com.ideastockexchange.app.ui.leaderboard.LeaderboardScreen
import com.ideastockexchange.app.ui.list.BeliefsListScreen
import com.ideastockexchange.app.ui.portfolio.PortfolioScreen
import com.ideastockexchange.app.ui.theme.IseTheme
import com.ideastockexchange.app.ui.web.WebScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            IseTheme { RootScaffold() }
        }
    }
}

private enum class RootTab(val title: String) {
    Browse("Browse"),
    Portfolio("Portfolio"),
    Leaderboard("Leaderboard"),
    Web("Web"),
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RootScaffold() {
    var tab by remember { mutableStateOf(RootTab.Browse) }
    val navController = rememberNavController()

    Scaffold(
        topBar = { AppTopBar(navController, tab) },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = tab == RootTab.Browse,
                    onClick = {
                        tab = RootTab.Browse
                        if (navController.currentDestination?.route != Routes.LIST) {
                            navController.popBackStack(Routes.LIST, inclusive = false)
                        }
                    },
                    icon = { Icon(Icons.Filled.List, contentDescription = null) },
                    label = { Text("Browse") },
                )
                NavigationBarItem(
                    selected = tab == RootTab.Portfolio,
                    onClick = { tab = RootTab.Portfolio },
                    icon = { Icon(Icons.Filled.ShowChart, contentDescription = null) },
                    label = { Text("Portfolio") },
                )
                NavigationBarItem(
                    selected = tab == RootTab.Leaderboard,
                    onClick = { tab = RootTab.Leaderboard },
                    icon = { Icon(Icons.Filled.Leaderboard, contentDescription = null) },
                    label = { Text("Top 10") },
                )
                NavigationBarItem(
                    selected = tab == RootTab.Web,
                    onClick = { tab = RootTab.Web },
                    icon = { Icon(Icons.Filled.Public, contentDescription = null) },
                    label = { Text("Web") },
                )
            }
        }
    ) { padding ->
        when (tab) {
            RootTab.Browse -> BrowseTab(navController, padding)
            RootTab.Portfolio -> androidx.compose.foundation.layout.Box(
                modifier = Modifier.fillMaxSize().padding(padding)
            ) { PortfolioScreen() }
            RootTab.Leaderboard -> androidx.compose.foundation.layout.Box(
                modifier = Modifier.fillMaxSize().padding(padding)
            ) { LeaderboardScreen() }
            RootTab.Web -> WebScreen(modifier = Modifier.fillMaxSize().padding(padding))
        }
    }
}

private object Routes {
    const val LIST = "list"
    const val DETAIL = "detail/{id}?statement={statement}"

    fun detail(id: Int, statement: String): String {
        val encoded = java.net.URLEncoder.encode(statement, "UTF-8")
        return "detail/$id?statement=$encoded"
    }
}

@Composable
private fun BrowseTab(navController: NavHostController, padding: PaddingValues) {
    NavHost(
        navController = navController,
        startDestination = Routes.LIST,
        modifier = Modifier.fillMaxSize().padding(padding),
    ) {
        composable(Routes.LIST) {
            BeliefsListScreen(
                onBeliefClick = { summary ->
                    val id = summary.beliefId.toIntOrNull() ?: return@BeliefsListScreen
                    navController.navigate(Routes.detail(id, summary.canonicalText))
                }
            )
        }
        composable(Routes.DETAIL) { entry ->
            val id = entry.arguments?.getString("id")?.toIntOrNull() ?: 0
            val statement = entry.arguments?.getString("statement")
                ?.let { java.net.URLDecoder.decode(it, "UTF-8") }
                ?: ""
            BeliefDetailScreen(
                beliefId = id,
                initialStatement = statement,
                onArgumentClick = { childId, childStatement ->
                    navController.navigate(Routes.detail(childId, childStatement))
                },
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AppTopBar(navController: NavHostController, tab: RootTab) {
    val backStackEntry by navController.currentBackStackEntryAsState()
    val showBack = tab == RootTab.Browse && backStackEntry?.destination?.route?.startsWith("detail") == true

    TopAppBar(
        title = {
            Text(
                when (tab) {
                    RootTab.Browse -> if (showBack) "Belief" else "Beliefs"
                    RootTab.Portfolio -> "Portfolio"
                    RootTab.Leaderboard -> "Top 10"
                    RootTab.Web -> "Idea Stock Exchange"
                }
            )
        },
        navigationIcon = {
            if (showBack) {
                androidx.compose.material3.IconButton(onClick = { navController.popBackStack() }) {
                    androidx.compose.material3.Icon(
                        imageVector = androidx.compose.material.icons.Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                    )
                }
            }
        },
    )
}
