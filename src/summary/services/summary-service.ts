import dayjs from 'dayjs';

import constants from 'utils/constants';

import { User } from 'user/models/user';
import { Test } from 'test/models/test';
import { Patient } from 'patient/models/patient';
import { Summary } from 'summary/models/summary';

import DateService from 'shared/services/date-service';
import LoggerService from 'shared/services/logger-service';

export default class SummaryService {
    async getSummary(data: any = {}, headers: any) {
        const now = new Date();

        // Defaults: current month start → now
        const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const defaultEnd = now;

        // Parse inputs; accept Date or ISO string
        const startDateIn = data?.startDate ? new Date(data.startDate) : defaultStart;
        const endDateIn = data?.endDate ? new Date(data.endDate) : defaultEnd;

        // Normalize to [start @00:00:00.000 , end @23:59:59.999]
        const rangeStart = new Date(
            startDateIn.getFullYear(), startDateIn.getMonth(), startDateIn.getDate(), 0, 0, 0, 0
        );
        const rangeEnd = new Date(
            endDateIn.getFullYear(), endDateIn.getMonth(), endDateIn.getDate(), 23, 59, 59, 999
        );

        // Today & month windows
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

        // -------- Filters --------
        const gender = data?.gender;

        // Patients: filter by gender and/or created_at range
        const patientFilter: any = {};
        if (gender) patientFilter.gender = gender;
        if (rangeStart || rangeEnd) patientFilter.created_at = { $gte: rangeStart, $lte: rangeEnd };

        // Tests: created_at range (add more filters like clinic_id/customer_id if you need)
        const testFilter: any = { created_at: { $gte: rangeStart, $lte: rangeEnd } };

        // If you want to scope by tenant/clinic/patient, uncomment:
        // if (data?.customer_id && Types.ObjectId.isValid(data.customer_id)) testFilter.customer_id = new Types.ObjectId(data.customer_id);
        // if (data?.clinic_id   && Types.ObjectId.isValid(data.clinic_id))   testFilter.clinic_id   = new Types.ObjectId(data.clinic_id);
        // if (data?.patient_id  && Types.ObjectId.isValid(data.patient_id))  testFilter.patient_id  = new Types.ObjectId(data.patient_id);

        // -------- Parallel counts --------
        const [
            TOTAL_PATIENTS,
            TOTAL_PATIENTS_THIS_MONTH,
            TOTAL_PATIENTS_TODAY,
            TOTAL_TESTS,
            TOTAL_TESTS_THIS_MONTH,
            TOTAL_TESTS_TODAY,
            TOTAL_CUSTOMERS,
            TOTAL_USERS
        ] = await Promise.all([
            // patients in range
            Patient.countDocuments(patientFilter),

            // patients since month start (respect gender if provided)
            Patient.countDocuments({
                ...('gender' in patientFilter ? { gender: patientFilter.gender } : {}),
                created_at: { $gte: monthStart, $lte: now }
            }),

            // patients since today start (respect gender if provided)
            Patient.countDocuments({
                ...('gender' in patientFilter ? { gender: patientFilter.gender } : {}),
                created_at: { $gte: todayStart, $lte: now }
            }),

            // tests in range (ALL test types in unified collection)
            Test.countDocuments(testFilter),

            // tests since month start
            Test.countDocuments({ created_at: { $gte: monthStart, $lte: now } }),

            // tests since today start
            Test.countDocuments({ created_at: { $gte: todayStart, $lte: now } }),

            // customers
            User.countDocuments({ user_type: { $in: [constants.USER_TYPES.CUSTOMER] } }),

            // users (admin + user)
            User.countDocuments({ user_type: { $in: [constants.USER_TYPES.ADMINISTRATOR, constants.USER_TYPES.USER] } })
        ]);

        return {
            TOTAL_USERS,
            TOTAL_TESTS,
            TOTAL_PATIENTS,
            TOTAL_CUSTOMERS,

            TOTAL_TESTS_TODAY,
            TOTAL_PATIENTS_TODAY,
            TOTAL_TESTS_THIS_MONTH,
            TOTAL_PATIENTS_THIS_MONTH
        };
    }

    async getDataSummary(filters?: {
        from_date?: string;
        to_date?: string;
        gender?: string;
        age_group?: string;
    }) {
        try {
            const summary: any = await Summary.findById("global").lean();
            if (!summary) {
                return {};
            }

            if (!filters || (!filters.from_date && !filters.to_date && !filters.gender && !filters.age_group)) {
                return summary;
            }

            let filteredSummary = this.filterSummaryData(summary, filters);

            filteredSummary.updated_at = summary.updated_at;
            filteredSummary.total_users = summary.total_users;
            filteredSummary.total_customers = summary.total_customers;

            return filteredSummary;

        } catch (error: any) {
            LoggerService.log('error', { error: error, message: `Error in getSummary: ${error}` });
            throw error;
        }
    }

    filterSummaryData(data: any, filters: any) {
        const dayjs = require('dayjs');
        const isBetween = require('dayjs/plugin/isBetween');
        dayjs.extend(isBetween);

        const fromDate = filters.from_date ? dayjs(filters.from_date) : null;
        const toDate = filters.to_date ? dayjs(filters.to_date) : null;

        const filterDates = (obj: any, unit: any) => {
            return Object.fromEntries(
                Object.entries(obj || {}).filter(([key]) => {
                    if (unit === 'day') {
                        const d = dayjs(key);
                        return (!fromDate || !d.isBefore(fromDate, 'day')) &&
                            (!toDate || !d.isAfter(toDate, 'day'));
                    } else {
                        // For monthly: key is "2025-09", check if month overlaps with date range
                        const monthStart = dayjs(`${key}-01`);
                        const monthEnd = monthStart.endOf('month');

                        // Include month if it has any overlap with the filter range
                        const isInRange = (!fromDate || !monthEnd.isBefore(fromDate, 'day')) &&
                            (!toDate || !monthStart.isAfter(toDate, 'day'));
                        return isInRange;
                    }
                })
            );
        };

        const sum = (obj: any) => Object.values(obj || {}).reduce((a: any, b: any) => a + b, 0);

        const process = (section: any) => {
            if (!section) return { total: 0, daily: {}, monthly: {} };

            let daily: any = {};
            let monthly: any = {};
            let total: number = 0;

            // If both gender AND age_group filters are applied
            if (filters.gender && filters.age_group) {
                if (section.gender?.[filters.gender]?.age_group?.[filters.age_group]) {
                    // Both filters exist in data, use nested data
                    const ageGroupData = section.gender[filters.gender].age_group[filters.age_group];
                    daily = filterDates(ageGroupData.daily, 'day');
                    monthly = filterDates(ageGroupData.monthly, 'month');
                    total = sum(daily) as number;
                } else {
                    // Filters applied but combination doesn't exist - return empty
                    daily = {};
                    monthly = {};
                    total = 0;
                }
            } else if (filters.gender) {
                // Only gender filter applied
                if (section.gender?.[filters.gender]) {
                    // Gender exists in data, use its data
                    const genderData = section.gender[filters.gender];
                    daily = filterDates(genderData.daily, 'day');
                    monthly = filterDates(genderData.monthly, 'month');
                    total = sum(daily) as number;
                } else {
                    // Gender filter applied but doesn't exist in data - return empty
                    daily = {};
                    monthly = {};
                    total = 0;
                }
            } else if (filters.age_group) {
                // Only age_group filter applied
                if (section.age_group?.[filters.age_group]) {
                    // Age group exists in data, use its data
                    const ageGroupData = section.age_group[filters.age_group];
                    daily = filterDates(ageGroupData.daily, 'day');
                    monthly = filterDates(ageGroupData.monthly, 'month');
                    total = sum(daily) as number;
                } else {
                    // Age group filter applied but doesn't exist - return empty
                    daily = {};
                    monthly = {};
                    total = 0;
                }
            } else {
                // No specific filter, use overall data
                daily = filterDates(section.daily, 'day');
                monthly = filterDates(section.monthly, 'month');
                total = sum(daily) as number;
            }

            const gender: any = {};
            if (section.gender) {
                // Filter by specific gender if provided, otherwise include all
                const gendersToProcess = filters.gender
                    ? [filters.gender]
                    : Object.keys(section.gender);

                for (const genderKey of gendersToProcess) {
                    const genderData = section.gender[genderKey];
                    if (!genderData) continue;

                    const genderDay = filterDates(genderData.daily, 'day');
                    const genderMonth = filterDates(genderData.monthly, 'month');
                    const genderTotal = sum(genderDay);

                    gender[genderKey] = { daily: genderDay, monthly: genderMonth, total: genderTotal };

                    if (genderData.age_group) {
                        gender[genderKey].age_group = {};
                        // Filter age groups within gender if specified
                        const ageGroupsToProcess = filters.age_group
                            ? [filters.age_group]
                            : Object.keys(genderData.age_group);

                        for (const ageGroup of ageGroupsToProcess) {
                            const ageGroupData = genderData.age_group[ageGroup];
                            if (!ageGroupData) continue;

                            const ageGroupDay = filterDates(ageGroupData.daily, 'day');
                            const ageGroupMonth = filterDates(ageGroupData.monthly, 'month');
                            const ageGroupTotal = sum(ageGroupDay);

                            gender[genderKey].age_group[ageGroup] = { daily: ageGroupDay, monthly: ageGroupMonth, total: ageGroupTotal };
                        }
                    }
                }
            }

            const age_group: any = {};
            if (section.age_group) {
                const ageGroupsToProcess = filters.age_group ? [filters.age_group] : Object.keys(section.age_group);

                for (const ageGroup of ageGroupsToProcess) {
                    const ageGroupData = section.age_group[ageGroup];
                    if (!ageGroupData) continue;

                    const ageGroupDay = filterDates(ageGroupData.daily, 'day');
                    const ageGroupMonth = filterDates(ageGroupData.monthly, 'month');
                    const ageGroupTotal = sum(ageGroupDay);

                    age_group[ageGroup] = { daily: ageGroupDay, monthly: ageGroupMonth, total: ageGroupTotal };
                }
            }

            return { total, daily, monthly, gender, age_group };
        };

        return {
            _id: data._id,
            basic_tests: process(data.basic_tests),
            hba1c_tests: process(data.hba1c_tests),
            lipid_tests: process(data.lipid_tests),
            tests: process(data.tests),
            patients: process(data.patients),
            total_users: data.total_users,
            total_customers: data.total_customers,
            updated_at: data.updated_at
        };
    }

    getDefaultStructuredSummary() {
        return {
            basic_tests: { total: 0, gender: { male: 0, female: 0 }, age_group: { '1-18': 0, '19-40': 0, '41-60': 0, '61-120': 0 } },
            lipid_tests: { total: 0, gender: { male: 0, female: 0 }, age_group: { '1-18': 0, '19-40': 0, '41-60': 0, '61-120': 0 } },
            hba1c_tests: { total: 0, gender: { male: 0, female: 0 }, age_group: { '1-18': 0, '19-40': 0, '41-60': 0, '61-120': 0 } },

            basic_tests_month: 0,
            lipid_tests_month: 0,
            hba1c_tests_month: 0,

            basic_tests_today: 0,
            lipid_tests_today: 0,
            hba1c_tests_today: 0,

            patients_total: 0,
            patients_month: 0,
            patients_today: 0,

            customers: 0
        };
    }

    async addBasicTest(data: { gender?: string; date_of_birth?: string | Date; created_at?: Date }) {
        const { today, month } = data.created_at
            ? this.getDateKeysFromDate(data.created_at, 'Asia/Kolkata')
            : this.getDateKeys('Asia/Kolkata');

        const ageGroupKey = DateService.getAgeGroup(data.date_of_birth); // may be undefined
        const genderKey = this.getGenderKey(data.gender);

        const incFields = {
            ...this.buildIncFields('basic_tests', today, month, genderKey, ageGroupKey),
            ...this.buildIncFields('tests', today, month, genderKey, ageGroupKey),
        };

        await Summary.updateOne(
            { _id: 'global' },
            {
                $inc: incFields,
                $currentDate: { updated_at: true },
                $setOnInsert: {
                    _id: 'global',
                    created_at: new Date()
                }
            },
            { upsert: true }
        );
    }

    async addHba1cTest(data: { gender?: string; date_of_birth?: string | Date; created_at?: Date }) {
        const { today, month } = data.created_at
            ? this.getDateKeysFromDate(data.created_at, 'Asia/Kolkata')
            : this.getDateKeys('Asia/Kolkata');

        const ageGroupKey = DateService.getAgeGroup(data.date_of_birth);
        const genderKey = this.getGenderKey(data.gender);

        const incFields = {
            ...this.buildIncFields('hba1c_tests', today, month, genderKey, ageGroupKey),
            ...this.buildIncFields('tests', today, month, genderKey, ageGroupKey),
        };

        await Summary.updateOne(
            { _id: 'global' },
            { $inc: incFields, $currentDate: { updated_at: true } },
            { upsert: true }
        );
    }

    async addLipidTest(data: { gender?: string; date_of_birth?: string | Date; created_at?: Date }) {
        const { today, month } = data.created_at
            ? this.getDateKeysFromDate(data.created_at, 'Asia/Kolkata')
            : this.getDateKeys('Asia/Kolkata');

        const ageGroupKey = DateService.getAgeGroup(data.date_of_birth);
        const genderKey = this.getGenderKey(data.gender);

        const incFields = {
            ...this.buildIncFields('lipid_tests', today, month, genderKey, ageGroupKey),
            ...this.buildIncFields('tests', today, month, genderKey, ageGroupKey),
        };

        await Summary.updateOne(
            { _id: 'global' },
            {
                $inc: incFields,
                $currentDate: { updated_at: true },
                $setOnInsert: {
                    _id: 'global',
                    created_at: new Date()
                }
            },
            { upsert: true }
        );
    }

    private getGenderKey(raw?: string) {
        const g = (raw ?? '').toLowerCase();
        if (g === constants.GENDER.FEMALE) return constants.GENDER.FEMALE;
        if (g === constants.GENDER.MALE) return constants.GENDER.MALE;
        return constants.GENDER.NONE;
    }

    private getDateKeys(tz: string = 'Asia/Kolkata') {
        // Localized "today" and "month" keys in the desired timezone
        const fmtDay = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
        const fmtMonth = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit' });

        const now = new Date();
        const today = fmtDay.format(now);     // e.g., "2025-10-20"
        const month = fmtMonth.format(now);   // e.g., "2025-10"

        return { today, month };
    }

    private getDateKeysFromDate(date: Date, tz: string = 'Asia/Kolkata') {
        // Format specific date in the desired timezone
        const fmtDay = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
        const fmtMonth = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit' });

        const today = fmtDay.format(date);     // e.g., "2025-10-20"
        const month = fmtMonth.format(date);   // e.g., "2025-10"

        return { today, month };
    }

    private buildIncFields(prefix: string, today: string, month: string, genderKey: string, ageGroupKey?: string) {
        const inc: Record<string, number> = {
            [`${prefix}.total`]: 1,
            [`${prefix}.daily.${today}`]: 1,
            [`${prefix}.monthly.${month}`]: 1,

            // gender buckets
            [`${prefix}.gender.${genderKey}.total`]: 1,
            [`${prefix}.gender.${genderKey}.daily.${today}`]: 1,
            [`${prefix}.gender.${genderKey}.monthly.${month}`]: 1,
        };

        if (ageGroupKey) {
            // age-group buckets
            inc[`${prefix}.age_group.${ageGroupKey}.total`] = 1;
            inc[`${prefix}.age_group.${ageGroupKey}.daily.${today}`] = 1;
            inc[`${prefix}.age_group.${ageGroupKey}.monthly.${month}`] = 1;

            // nested gender + age-group breakdown
            inc[`${prefix}.gender.${genderKey}.age_group.${ageGroupKey}.total`] = 1;
            inc[`${prefix}.gender.${genderKey}.age_group.${ageGroupKey}.daily.${today}`] = 1;
            inc[`${prefix}.gender.${genderKey}.age_group.${ageGroupKey}.monthly.${month}`] = 1;
        }

        return inc;
    }

    async addPatient(data: { gender?: string; date_of_birth?: string | Date; created_at?: Date }) {
        const { today, month } = data.created_at
            ? this.getDateKeysFromDate(data.created_at, 'Asia/Kolkata')
            : this.getDateKeys('Asia/Kolkata');

        const ageGroupKey = DateService.getAgeGroup(data.date_of_birth);
        const genderKey = this.getGenderKey(data.gender);

        const incFields = this.buildIncFields('patients', today, month, genderKey, ageGroupKey);

        await Summary.updateOne(
            { _id: 'global' },
            {
                $inc: incFields,
                $currentDate: { updated_at: true },
                $setOnInsert: {
                    _id: 'global',
                    created_at: new Date()
                }
            },
            { upsert: true }
        );
    }

    async addCustomer() {
        await Summary.updateOne(
            { _id: "global" },
            {
                $inc: { "total_customers": 1 },
                $set: { updated_at: new Date() }
            },
            { upsert: true }
        );
    }

    async addUser() {
        await Summary.updateOne(
            { _id: "global" },
            {
                $inc: { "total_users": 1 },
                $set: { updated_at: new Date() }
            },
            { upsert: true }
        );
    }

    getDateFilter(filter: any) {
        const currentDate = new Date();
        let matchStage: any = {};

        if (filter.type === "day") {
            matchStage["created_at"] = {
                $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
                $lt: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
            };
        } else if (filter.type === "month") {
            matchStage["created_at"] = {
                $gte: new Date(currentDate.getFullYear(), 0, 1),
                $lt: new Date(currentDate.getFullYear() + 1, 0, 1),
            };
        } else if (filter.type === "year") {
            matchStage["created_at"] = {
                $gte: new Date(currentDate.getFullYear() - 10, 0, 1), // Last 10 years
                $lt: new Date(currentDate.getFullYear() + 1, 0, 1),
            };
        }

        return matchStage;
    };

    getGroupingStage(filter: any) {
        let groupBy: any = { year: { $year: "$created_at" } };

        if (filter.type === "day") {
            groupBy["month"] = { $month: "$created_at" };
            groupBy["day"] = { $dayOfMonth: "$created_at" };
        } else if (filter.type === "month") {
            groupBy["month"] = { $month: "$created_at" };
        }

        return groupBy;
    };

    getDateRange(from: string, to: string): string[] {
        const start = new Date(from);
        const end = new Date(to);
        const dates: string[] = [];

        while (start <= end) {
            dates.push(start.toISOString().slice(0, 10));
            start.setDate(start.getDate() + 1);
        }

        return dates;
    }

    /**
     * Fetches the count of unique patients grouped by day, month, or year.
     */
    async getSummaryPatients(data: any, headers: any) {
        try {
            const matchStage = this.getDateFilter(data);
            const groupBy = this.getGroupingStage(data);

            const result = await Patient.aggregate([
                { $match: matchStage }, // Early filtering for better performance
                {
                    $group: {
                        _id: groupBy,
                        total: { $sum: 1 } // Counting unique patients
                    },
                },
                { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } }
            ]);

            return result;
        } catch (error: any) {
            throw error;
        }
    };

    /**
     * Fetches the count of tests grouped by day, month, or year.
     */
    async getSummaryTests(data: any, headers: any) {
        try {
            const matchStage = this.getDateFilter(data);
            const groupBy = this.getGroupingStage(data);

            const result = await Patient.aggregate([
                {
                    $facet: {
                        basicTests: [
                            { $match: matchStage },
                            { $group: { _id: groupBy, count: { $sum: 1 } } },
                            { $project: { _id: 1, basic_tests: "$count" } }
                        ],
                        lipidTests: [
                            { $match: matchStage },
                            { $group: { _id: groupBy, count: { $sum: 1 } } },
                            { $project: { _id: 1, lipid_tests: "$count" } }
                        ],
                        hba1cTests: [
                            { $match: matchStage },
                            { $group: { _id: groupBy, count: { $sum: 1 } } },
                            { $project: { _id: 1, hba1c_tests: "$count" } }
                        ]
                    }
                },
                {
                    $project: {
                        combined: { $concatArrays: ["$basicTests", "$lipidTests", "$hba1cTests"] }
                    }
                },
                { $unwind: "$combined" },
                {
                    $group: {
                        _id: "$combined._id",
                        basic_tests: { $sum: "$combined.basic_tests" },
                        lipid_tests: { $sum: "$combined.lipid_tests" },
                        hba1c_tests: { $sum: "$combined.hba1c_tests" },
                        total: {
                            $sum: {
                                $add: [
                                    { $ifNull: ["$combined.basic_tests", 0] },
                                    { $ifNull: ["$combined.lipid_tests", 0] },
                                    { $ifNull: ["$combined.hba1c_tests", 0] }
                                ]
                            }
                        }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
                { $merge: { into: "summary_tests", whenMatched: "merge", whenNotMatched: "insert" } }
            ]);

            return { count: result.length, data: result };
        } catch (error) {
            throw error;
        }
    }
}    