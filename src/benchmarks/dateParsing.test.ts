import { describe, it } from 'vitest';
import { parseRobustDate } from '../utils/importUtils';

describe('Date Parsing Benchmark', () => {
    const ITERATIONS = 10000;

    it('benchmarks parseRobustDate with mixed formats', () => {
        const datesToTest = [
            { date: '2023-10-25', format: undefined }, // ISO
            { date: '25/10/2023', format: 'd/M/yyyy' }, // Explicit DMY
            { date: '10/25/2023', format: 'M/d/yyyy' }, // Explicit MDY
            { date: '2023-10-25', format: 'auto' }, // Auto
            { date: 'invalid-date', format: 'auto' }, // Invalid
        ];

        const start = performance.now();

        for (let i = 0; i < ITERATIONS; i++) {
            for (const { date, format } of datesToTest) {
                parseRobustDate(date, format);
            }
        }

        const end = performance.now();
        console.log(`\n\n[Benchmark] parseRobustDate x ${ITERATIONS} iterations: ${(end - start).toFixed(2)}ms\n\n`);
    });
});
