# Garmin Connect Developer Program --- Start Guide

**Version 1.1.0**\
**CONFIDENTIAL**

## 🧾 Table des matières

1.  [Revision History](#revision-history)\
2.  [Getting Started](#getting-started)
    -   [Purpose of the Garmin Connect Developer programs](#purpose)\
    -   [Client ID and Client Secret](#client-id-and-secret)\
    -   [User Registration](#user-registration)\
    -   [Setting up Client ID with API Tools](#setting-up-client-id)
        -   [API Configuration](#api-configuration)\
        -   [Endpoint Configuration](#endpoint-configuration)\
        -   [User Authorization tool](#user-authorization-tool)\
    -   [Requesting a Production-level App](#requesting-production-app)\
    -   [Endpoint Configuration
        (détails)](#endpoint-configuration-details)
        -   [Security Review](#security-review)\
        -   [Deregistration endpoint](#deregistration-endpoint)\
        -   [User Permission endpoint](#user-permission-endpoint)\
3.  [User Endpoints](#user-endpoints)
    -   [Delete User Access Token](#delete-user-access-token)\
    -   [Get User ID](#get-user-id)\
4.  [Developer Account](#developer-account)
    -   [Team Members and Accesses](#team-members-and-accesses)\
    -   [API Updates: sign-up steps](#api-updates)

------------------------------------------------------------------------

## 1. Revision History

  Version   Date         Revisions
  --------- ------------ ---------------------------------
  1.0.0     12/01/2020   First release
  1.1.0     06/30/2025   Developer Account section added

------------------------------------------------------------------------

## 2. Getting Started

**Support Email:** <connect-support@developer.garmin.com>

### 2.1 Purpose of the Garmin Connect Developer programs

The Garmin Connect Developer Program (GCDP) allows Garmin users to share
their device-generated data with **non-Garmin corporate partners** and
to **download workouts and courses** from partners to their devices.

The program consists of **five APIs**:

-   **Training API** -- upload workouts\
-   **Courses API** -- upload courses\
-   **Health API** -- import wellness data\
-   **Activity API** -- import activities\
-   **Women's Health API** -- import women's health data

> ⚙️ Access is restricted to **server-to-server communication only** (no
> direct end-user access).\
> APIs support secure one-time data transfers. PING notifications are
> guaranteed for 7 days after receipt (24 h for Activity Files).

------------------------------------------------------------------------

### 2.2 Client ID and Client Secret

To access APIs, create a **Client ID** and **Client Secret** in the
[Developer
Portal](https://developerportal.garmin.com/user/me/apps?program=829).

-   The **Client ID** identifies your application (public).\
-   The **Client Secret** validates requests (private).

Never expose your secret in public (e.g., browser or mobile code).

#### 🔑 Key types

-   **Evaluation key** -- rate-limited, for development/testing.
-   **Production key** -- requires verification.\
    → See [Requesting a Production-level
    App](#requesting-production-app).

------------------------------------------------------------------------

### 2.3 User Registration

Before accessing user data, each user must **grant consent** via
OAuth2.\
Refer to [Garmin OAuth2
documentation](https://developerportal.garmin.com/developer-programs/content/829/programs-docs).

------------------------------------------------------------------------

### 2.4 Setting up Client ID with API Tools

Access integration tools via <https://apis.garmin.com/tools/login> using
your Client ID + Secret.

#### 2.4.1 API Configuration

You can modify API selections for **evaluation apps**.\
Production changes require Garmin support approval.

#### 2.4.2 Endpoint Configuration

Default endpoints: - `deregistration` → notifies when a user
disconnects\
- `userPermission` → notifies when a user revokes authorization\
Additional endpoints depend on selected APIs.

#### 2.4.3 User Authorization Tool

This tool manages and demonstrates the **OAuth2 authorization flow**.

------------------------------------------------------------------------

### 2.5 Requesting a Production-level App

Email <connect-support@developer.garmin.com>\
Include: - Your **evaluation key** - The list of **API pillars** you are
using.

Create separate **Client IDs** for distinct projects or customer bases.

------------------------------------------------------------------------

### 2.6 Endpoint Configuration (webhooks)

All Garmin APIs use **webhooks** (PING/PUSH notifications).\
Configure them via [API Tools](https://apis.garmin.com/tools/endpoints).

#### Ping vs Push

-   **Ping Service** -- sends callback notifications for updates.\
-   **Push Service** -- sends full JSON payloads directly via HTTPS
    POST.

------------------------------------------------------------------------

#### 2.6.1 Security Review

All new endpoint domains undergo **automatic security review** within
24--48 h.\
For production changes, contact support for pre-validation.

------------------------------------------------------------------------

#### 2.6.2 Deregistration Endpoint

Notifies when a user disconnects (or app calls `DELETE /registration`).

**Example JSON:**

``` json
{
  "deregistrations": [
    { "userId": "4aacafe82427c251df9c9592d0c06768" }
  ]
}
```

------------------------------------------------------------------------

#### 2.6.3 User Permission Endpoint

Users can revoke data sharing in\
[Account
Settings](https://connect.garmin.com/modern/settings/accountInformation).

**Example Notification:**

``` json
{
  "userPermissionsChange": [{
    "userId": "31be9cac-5bf9-406b-9fa8-89879bcaceac",
    "summaryId": "x120d383-60256e84",
    "permissions": [
      "ACTIVITY_EXPORT",
      "WORKOUT_IMPORT",
      "HEALTH_EXPORT",
      "COURSE_IMPORT",
      "MCT_EXPORT"
    ],
    "changeTimeInSeconds": 1613065860
  }]
}
```

**GET endpoint:**\
`https://apis.garmin.com/wellness-api/rest/user/permissions`

**Response example:**

``` json
[
  "ACTIVITY_EXPORT",
  "WORKOUT_IMPORT",
  "HEALTH_EXPORT",
  "COURSE_IMPORT",
  "MCT_EXPORT"
]
```

------------------------------------------------------------------------

## 3. User Endpoints

These perform actions on a user's account (not data retrieval).

### 3.1 Delete User Access Token

Removes user registration for a given Client ID.\
Triggers a final **Deregistration notification** and stops all future
updates.

**DELETE**

    https://apis.garmin.com/wellness-api/rest/user/registration

Response: `HTTP 204 No Content`

Use this endpoint whenever your app allows users to "Delete My Account"
or revoke consent.

------------------------------------------------------------------------

### 3.2 Get User ID

Fetch the persistent API User ID linked to a user's Garmin Connect
account.

**GET**

    https://apis.garmin.com/wellness-api/rest/user/id

**Response:**

``` json
{"userId": "d3315b1072421d0dd7c8f6b8e1de4df8"}
```

The ID is stable across all integrations for the same user.

------------------------------------------------------------------------

## 4. Developer Account

### 4.1 Team Members and Accesses

All developers needing access must be added as **verified users** on
[developerportal.garmin.com](https://developerportal.garmin.com).

**Restrictions:** - No generic emails (e.g. `support@`, `info@`,
`dev@`).\
- No free-mail domains (e.g. Gmail, Outlook).\
- Third-party integrators require an **NDA** copy.\
- Access sharing with unverified users ⇒ revocation risk.

> To manage team members:\
> Log in → Company Name → **Members** section.

------------------------------------------------------------------------

### 4.2 API Updates: Sign-up Steps

Subscribe for **API update notifications**:

`My Account → Notify Settings → Receive Email → Subscriptions → Blog Entry`

> ✅ Highly recommended to stay informed of new API releases.
