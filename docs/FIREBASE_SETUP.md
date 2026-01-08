# WORKB Mobile - Firebase 설정 가이드

Firebase는 **FCM 푸시 알림**과 **Analytics**만 사용합니다.

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com)에서 새 프로젝트 생성
2. 프로젝트 이름: `workb-mobile` (또는 원하는 이름)
3. Google Analytics 활성화

## 2. iOS 설정

### 2.1 Firebase에 iOS 앱 등록

1. Firebase Console → 프로젝트 설정 → 앱 추가 → iOS
2. Bundle ID 입력: `com.workb.mobile`
3. `GoogleService-Info.plist` 다운로드

### 2.2 Xcode 설정

```bash
# iOS 폴더로 이동
cd ios

# Pod 설치
pod install
```

1. `GoogleService-Info.plist`를 `ios/` 폴더에 복사
2. Xcode에서 프로젝트 열기: `open WorkbMobile.xcworkspace`
3. `GoogleService-Info.plist`를 프로젝트에 드래그 (Copy items if needed 체크)

### 2.3 Push Notification Capability 추가

1. Xcode → 프로젝트 선택 → Signing & Capabilities
2. `+ Capability` 클릭
3. `Push Notifications` 추가
4. `Background Modes` 추가 → `Remote notifications` 체크

### 2.4 APNs 키 설정

1. [Apple Developer Portal](https://developer.apple.com) → Certificates, Identifiers & Profiles
2. Keys → Create a key
3. Name: `WORKB FCM Key`
4. Enable: `Apple Push Notifications service (APNs)`
5. `.p8` 파일 다운로드
6. Firebase Console → 프로젝트 설정 → Cloud Messaging → iOS app configuration
7. APNs Authentication Key 업로드 (Key ID, Team ID 입력)

### 2.5 AppDelegate.mm 수정

```objective-c
// ios/WorkbMobile/AppDelegate.mm

#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
#import <Firebase.h>
#import <UserNotifications/UserNotifications.h>
#import <RNCPushNotificationIOS.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Firebase 초기화
  [FIRApp configure];

  self.moduleName = @"WorkbMobile";
  self.initialProps = @{};

  // 푸시 알림 권한 요청
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  center.delegate = self;

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

// Remote Notifications
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  [RNCPushNotificationIOS didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [RNCPushNotificationIOS didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  [RNCPushNotificationIOS didFailToRegisterForRemoteNotificationsWithError:error];
}

// UNUserNotificationCenterDelegate
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
withCompletionHandler:(void (^)(void))completionHandler
{
  [RNCPushNotificationIOS didReceiveNotificationResponse:response];
  completionHandler();
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center
willPresentNotification:(UNNotification *)notification
withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  completionHandler(UNNotificationPresentationOptionSound | UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionBadge);
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
```

## 3. Android 설정

### 3.1 Firebase에 Android 앱 등록

1. Firebase Console → 프로젝트 설정 → 앱 추가 → Android
2. Package name 입력: `com.workb.mobile`
3. `google-services.json` 다운로드
4. 파일을 `android/app/` 폴더에 복사

### 3.2 android/build.gradle 수정

```gradle
// android/build.gradle

buildscript {
    ext {
        // ...existing code...
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.1.1")
        classpath("com.google.gms:google-services:4.4.0")  // 추가
    }
}
```

### 3.3 android/app/build.gradle 수정

```gradle
// android/app/build.gradle

apply plugin: "com.android.application"
apply plugin: "com.google.gms.google-services"  // 추가

// ...existing code...

dependencies {
    // Firebase BOM
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-analytics'
    implementation 'com.google.firebase:firebase-messaging'

    // ...existing dependencies...
}
```

### 3.4 android/app/src/main/AndroidManifest.xml 수정

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
      android:name=".MainApplication"
      android:label="@string/app_name"
      android:icon="@mipmap/ic_launcher"
      android:allowBackup="false"
      android:theme="@style/AppTheme">

      <activity
        android:name=".MainActivity"
        android:label="@string/app_name"
        android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
        android:launchMode="singleTask"
        android:windowSoftInputMode="adjustResize"
        android:exported="true">
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
      </activity>

      <!-- FCM Default Notification Channel -->
      <meta-data
        android:name="com.google.firebase.messaging.default_notification_channel_id"
        android:value="workb_default" />

      <!-- FCM Default Icon -->
      <meta-data
        android:name="com.google.firebase.messaging.default_notification_icon"
        android:resource="@mipmap/ic_launcher" />

    </application>
</manifest>
```

## 4. 프로젝트 초기화

```bash
# 프로젝트 루트에서
cd workb_mobile

# Node modules 설치
npm install

# iOS Pod 설치
cd ios && pod install && cd ..

# Android Gradle Sync
cd android && ./gradlew clean && cd ..
```

## 5. 앱 실행

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

## 6. FCM 테스트

### Firebase Console에서 테스트 메시지 전송

1. Firebase Console → Cloud Messaging → Send your first message
2. 앱이 백그라운드 상태일 때 알림이 표시되는지 확인
3. 알림 탭하여 앱 열리는지 확인

### 서버에서 FCM 전송 (Node.js 예시)

```javascript
const admin = require('firebase-admin');

// Firebase Admin SDK 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// FCM 메시지 전송
async function sendPushNotification(token, title, body, data) {
  const message = {
    notification: {
      title,
      body,
    },
    data,
    token,
  };

  await admin.messaging().send(message);
}
```

## 7. 문제 해결

### iOS: 푸시 알림이 오지 않음
- APNs 키가 Firebase에 올바르게 업로드되었는지 확인
- Xcode에서 Push Notifications capability가 활성화되었는지 확인
- 실제 기기에서 테스트 (시뮬레이터는 푸시 알림 지원 제한적)

### Android: 푸시 알림이 오지 않음
- `google-services.json`이 `android/app/` 폴더에 있는지 확인
- Android 13+ 기기에서 알림 권한 요청 여부 확인
- Firebase Console에서 앱 패키지명이 일치하는지 확인

### 토큰이 생성되지 않음
- 네트워크 연결 상태 확인
- Firebase 설정 파일이 올바른 위치에 있는지 확인
