import SwiftUI

struct ContentView: View {
    @State private var activeCalories: Double = 0
    @State private var status: String = "Ready"
    @State private var isLoading = false

    private let healthKit = HealthKitManager()

    // Replace with your deployed Nutri-MVP URL, e.g. https://nutri-mvp.vercel.app
    private let api = APIClient(
        baseURL: ProcessInfo.processInfo.environment["NUTRI_BASE_URL"] ?? "http://localhost:3000",
        apiKey: ProcessInfo.processInfo.environment["NUTRI_ACTIVITY_API_KEY"]
    )

    var body: some View {
        NavigationView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Active Calories Today")
                    .font(.headline)

                Text("\(Int(activeCalories)) kcal")
                    .font(.system(size: 40, weight: .bold, design: .rounded))

                Text("Status: \(status)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Button(isLoading ? "Syncing..." : "Sync from HealthKit") {
                    Task {
                        await sync()
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(isLoading)

                Spacer()
            }
            .padding()
            .navigationTitle("Nutri Health PoC")
        }
    }

    private func sync() async {
        isLoading = true
        status = "Requesting HealthKit permission..."

        do {
            try await healthKit.requestReadPermission()
            status = "Reading active calories..."

            let kcal = try await healthKit.fetchTodayActiveCalories()
            activeCalories = kcal

            status = "Sending to Nutri API..."
            let date = ISO8601DateFormatter().string(from: Date()).prefix(10)
            let response = try await api.syncActiveCalories(date: String(date), activeCalories: kcal)

            status = "Synced ✅ \(Int(response.activity.activeCalories)) kcal for \(response.activity.date)"
        } catch {
            status = "Failed ❌ \(error.localizedDescription)"
        }

        isLoading = false
    }
}

#Preview {
    ContentView()
}
