import SwiftUI

@main
struct NutriMVPHealthPoCApp: App {
    @StateObject private var syncViewModel = SyncViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(syncViewModel)
                .task {
                    await syncViewModel.bootstrapBackgroundSync()
                }
        }
    }
}
