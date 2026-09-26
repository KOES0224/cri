// Test environment for src/lib/meta: a pixel id and token so gating logic can be exercised without network access.
process.env.NEXT_PUBLIC_META_PIXEL_ID = '2270683237022393';
process.env.META_CAPI_ACCESS_TOKEN = 'test-token';
process.env.META_TEST_EVENT_CODE = 'TEST1234';
process.env.META_LEAD_VALUE_USD = '25';
delete process.env.META_SUBMIT_APPLICATION_VALUE_USD;
delete process.env.NEXT_PUBLIC_META_ALLOWED_HOSTS;
export {};
