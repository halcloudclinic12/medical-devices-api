interface IBase {
    created_at: Date,
    deleted_at: Date,
    updated_at: Date,
    unique_id: string,
    is_active: boolean,
    is_deleted: boolean,
}

interface ITest extends IBase {
    status: boolean,
    clinic_id: string,
    test_type: string,
    patient_id: string,
    customer_id: string,

    city_id: string,
    state_id: string,
    country_id: string,

    sync_id: number,    // to store ids of offline synced records

    city: any,
    state: any,
    clinic: any,
    country: any,
    patient: any,
    customer: any
}

export { IBase, ITest };