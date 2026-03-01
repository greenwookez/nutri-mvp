import SwiftUI

@MainActor
final class SyncViewModel: ObservableObject {
    @Published var activeCalories: Double = 0
    @Published var status: String = "Ready"
    @Published var isSyncing = false
    @Published var lastBackgroundSyncAt: Date?
    @Published var lastBackgroundSyncResult: String = "Not yet"

    private let healthKit = HealthKitManager()
    private let api = APIClient(
        baseURL: ProcessInfo.processInfo.environment["NUTRI_BASE_URL"] ?? "http://localhost:3000",
        apiKey: ProcessInfo.processInfo.environment["NUTRI_ACTIVITY_API_KEY"]
    )

    private let defaults = UserDefaults.standard
    private let keyBackgroundDate = "nutri.lastBackgroundSyncAt"
    private let keyBackgroundResult = "nutri.lastBackgroundSyncResult"
    private let keyLastStatus = "nutri.lastStatus"

    init() {
        lastBackgroundSyncAt = defaults.object(forKey: keyBackgroundDate) as? Date
        lastBackgroundSyncResult = defaults.string(forKey: keyBackgroundResult) ?? "Not yet"
        status = defaults.string(forKey: keyLastStatus) ?? "Ready"
    }

    func bootstrapBackgroundSync() async {
        do {
            try await healthKit.requestReadPermission()
            try await healthKit.startBackgroundDelivery { [weak self] in
                guard let self else { return }
                Task { @MainActor in
                    await self.sync(trigger: .background)
                }
            }
            log("Background delivery enabled ✅")
        } catch {
            log("Background setup failed ❌ \(error.localizedDescription)")
        }
    }

    func manualSync() async {
        await sync(trigger: .manual)
    }

    private enum Trigger {
        case manual
        case background

        var source: String {
            switch self {
            case .manual: return "ios-healthkit-manual"
            case .background: return "ios-healthkit-background"
            }
        }
    }

    private func sync(trigger: Trigger) async {
        if isSyncing { return }

        isSyncing = true
        log(trigger == .manual ? "Manual sync started…" : "Background update received…")

        defer { isSyncing = false }

        do {
            let kcal = try await healthKit.fetchTodayActiveCalories()
            activeCalories = kcal

            let date = ISO8601DateFormatter().string(from: Date()).prefix(10)
            let response = try await api.syncActiveCalories(date: String(date), activeCalories: kcal, source: trigger.source)
            log("Synced ✅ \(Int(response.activity.activeCalories)) kcal for \(response.activity.date)")

            if trigger == .background {
                let now = Date()
                lastBackgroundSyncAt = now
                lastBackgroundSyncResult = "Success: \(Int(response.activity.activeCalories)) kcal"
                defaults.set(now, forKey: keyBackgroundDate)
                defaults.set(lastBackgroundSyncResult, forKey: keyBackgroundResult)
            }
        } catch {
            let msg = "Failed ❌ \(error.localizedDescription)"
            log(msg)
            if trigger == .background {
                lastBackgroundSyncAt = Date()
                lastBackgroundSyncResult = msg
                defaults.set(lastBackgroundSyncAt, forKey: keyBackgroundDate)
                defaults.set(lastBackgroundSyncResult, forKey: keyBackgroundResult)
            }
        }
    }

    private func log(_ text: String) {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        status = "[\(formatter.string(from: Date()))] \(text)"
        defaults.set(status, forKey: keyLastStatus)
        NSLog("[NutriMVP][Sync] \(status)")
    }
}

struct ContentView: View {
    @EnvironmentObject private var vm: SyncViewModel

    var body: some View {
        NavigationView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Active Calories Today")
                    .font(.headline)

                Text("\(Int(vm.activeCalories)) kcal")
                    .font(.system(size: 40, weight: .bold, design: .rounded))

                Text("Status: \(vm.status)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                VStack(alignment: .leading, spacing: 4) {
                    Text("Last background sync: \(formatted(vm.lastBackgroundSyncAt))")
                    Text("Result: \(vm.lastBackgroundSyncResult)")
                }
                .font(.footnote)
                .foregroundColor(.secondary)

                Button(vm.isSyncing ? "Syncing..." : "Sync from HealthKit") {
                    Task { await vm.manualSync() }
                }
                .buttonStyle(.borderedProminent)
                .disabled(vm.isSyncing)

                Spacer()
            }
            .padding()
            .navigationTitle("Nutri Health PoC")
        }
    }

    private func formatted(_ date: Date?) -> String {
        guard let date else { return "Never" }
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .medium
        return formatter.string(from: date)
    }
}

#Preview {
    ContentView().environmentObject(SyncViewModel())
}
