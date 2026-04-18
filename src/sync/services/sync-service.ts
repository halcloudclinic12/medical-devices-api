import BadRequestError from 'shared/errors/bad-request-error';
import LoggerService from 'shared/services/logger-service';
import TestService from 'test/services/test-service';

export default class SyncService {
    private readonly testService: TestService;

    constructor() {
        this.testService = new TestService();
    }

    async sync(data: any, headers: any = null) {
        try {
            if (!Array.isArray(data) || data.length === 0) {
                throw new BadRequestError('Invalid request');
            }

            let failedTest: any;
            let storedTest: any;
            let existingTest: any;
            let failedTests: any[] = [];
            let storedTests: string[] = [];
            let existingTests: string[] = [];

            for (const test of data) {
                try {
                    const { test_type, sync_id } = test;

                    if (!test_type || !sync_id) {
                        failedTests.push(test);
                        continue; // Skip invalid entries
                    }

                    failedTest = null;
                    storedTest = null;
                    existingTest = await this.testService.findOne({ sync_id: sync_id }, headers);
                    if (!existingTest) {
                        storedTest = await this.testService.store(test, headers);
                    }
                } catch (error) {
                    test.error = JSON.stringify(error);
                    failedTest.push(test);
                    LoggerService.log('error', { error: error, message: 'Error in syncing test', location: 'sync-service' });
                }

                if (storedTest) {
                    storedTests.push(test.sync_id);
                } else if (failedTest) {
                    failedTests.push(failedTest);
                } else if (existingTest) {
                    existingTests.push(test.sync_id);
                }
            }

            return {
                failed_tests: failedTests,
                stored_tests: storedTests,
                existing_tests: existingTests,
                success: failedTests.length === 0
            };
        } catch (error) {
            LoggerService.log('error', { error: error, message: 'Error in syncing test', location: 'sync-service => sync', data: JSON.stringify(error) });
            throw new Error('Internal server error');
        }
    }
}