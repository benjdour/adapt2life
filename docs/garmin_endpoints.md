
# Garmin Connect Webhook Endpoints (Adapt2Life)

## Activity Endpoints
- **Activities:** `https://adapt2life.app/api/garmin/webhooks/push/activities`
- **Activity Details:** `https://adapt2life.app/api/garmin/webhooks/push/activityDetails`
- **Activity Files:** `https://adapt2life.app/api/garmin/webhooks/push/activityFiles`
- **Manually Updated Activities:** `https://adapt2life.app/api/garmin/webhooks/push/manuallyUpdatedActivities`
- **MoveIQ:** `https://adapt2life.app/api/garmin/webhooks/push/moveIQ`

## Common Endpoints
- **Deregistrations:** `https://adapt2life.app/api/garmin/webhooks/push/deregistrations`
- **User Permissions Change:** `https://adapt2life.app/api/garmin/webhooks/push/userPermissionsChange`

## Health Endpoints
- **Blood Pressure:** `https://adapt2life.app/api/garmin/webhooks/push/bloodPressure`
- **Body Compositions:** `https://adapt2life.app/api/garmin/webhooks/push/bodyCompositions`
- **Dailies:** `https://adapt2life.app/api/garmin/webhooks/push/dailies`
- **Epochs:** `https://adapt2life.app/api/garmin/webhooks/push/epochs`
- **HRV Summary:** `https://adapt2life.app/api/garmin/webhooks/push/hrv`
- **Health Snapshot:** `https://adapt2life.app/api/garmin/webhooks/push/healthSnapshot`
- **Pulse Ox:** `https://adapt2life.app/api/garmin/webhooks/push/pulseOx`
- **Respiration:** `https://adapt2life.app/api/garmin/webhooks/push/respiration`
- **Skin Temperature:** `https://adapt2life.app/api/garmin/webhooks/push/skinTemp`
- **Sleeps:** `https://adapt2life.app/api/garmin/webhooks/push/sleeps`
- **Stress Details:** `https://adapt2life.app/api/garmin/webhooks/push/stressDetails`
- **User Metrics:** `https://adapt2life.app/api/garmin/webhooks/push/userMetrics`

## Women Health
- **Menstrual Cycle Tracking:** `https://adapt2life.app/api/garmin/webhooks/push/womenHealth`

## Scheduled Pulls
- **Women Health Pull (Cron, header `x-cron-secret`):** `https://adapt2life.app/api/cron/garmin/women-health/pull`
- **Garmin Trainer Jobs (Cron, header `x-cron-secret`):** `https://adapt2life.app/api/cron/garmin-trainer/jobs`
