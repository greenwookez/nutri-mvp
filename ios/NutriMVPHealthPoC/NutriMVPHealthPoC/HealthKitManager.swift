import Foundation
import HealthKit

final class HealthKitManager {
    private let healthStore = HKHealthStore()
    private let activeEnergyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!
    private var observerQuery: HKObserverQuery?

    var isHealthDataAvailable: Bool {
        HKHealthStore.isHealthDataAvailable()
    }

    func requestReadPermission() async throws {
        guard isHealthDataAvailable else {
            throw HealthKitError.notAvailable
        }

        try await healthStore.requestAuthorization(toShare: [], read: [activeEnergyType])
    }

    func fetchTodayActiveCalories() async throws -> Double {
        guard isHealthDataAvailable else {
            throw HealthKitError.notAvailable
        }

        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)

        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: activeEnergyType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { _, result, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                let value = result?.sumQuantity()?.doubleValue(for: HKUnit.kilocalorie()) ?? 0
                continuation.resume(returning: value)
            }

            healthStore.execute(query)
        }
    }

    func startBackgroundDelivery(onUpdate: @escaping @Sendable () -> Void) async throws {
        guard isHealthDataAvailable else {
            throw HealthKitError.notAvailable
        }

        if observerQuery == nil {
            let query = HKObserverQuery(sampleType: activeEnergyType, predicate: nil) { [weak self] _, completionHandler, error in
                guard self != nil else {
                    completionHandler()
                    return
                }

                if let error {
                    NSLog("[NutriMVP][HK] Observer query error: \(error.localizedDescription)")
                    completionHandler()
                    return
                }

                onUpdate()
                completionHandler()
            }

            observerQuery = query
            healthStore.execute(query)
        }

        try await withCheckedThrowingContinuation { continuation in
            healthStore.enableBackgroundDelivery(for: activeEnergyType, frequency: .immediate) { success, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                if success {
                    continuation.resume()
                } else {
                    continuation.resume(throwing: HealthKitError.backgroundDeliveryNotEnabled)
                }
            }
        }
    }
}

enum HealthKitError: LocalizedError {
    case notAvailable
    case backgroundDeliveryNotEnabled

    var errorDescription: String? {
        switch self {
        case .notAvailable:
            return "HealthKit is not available on this device."
        case .backgroundDeliveryNotEnabled:
            return "Could not enable HealthKit background delivery."
        }
    }
}
