export default class DateService {
    static getAgeGroup(date_of_birth: string | Date): string {
        if (!date_of_birth) return null;

        const now = new Date();

        let age = 0;
        if (date_of_birth) {
            const dob = new Date(date_of_birth);
            age = now.getFullYear() - dob.getFullYear();
            const m = now.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
                age--;
            }
        }

        // 🎯 Determine age group key
        let ageGroup = "unknown";
        if (age >= 1 && age <= 18) ageGroup = "1-18";
        else if (age >= 19 && age <= 40) ageGroup = "19-40";
        else if (age >= 41 && age <= 60) ageGroup = "41-60";
        else if (age >= 61 && age <= 120) ageGroup = "61-120";

        return ageGroup;
    }
}