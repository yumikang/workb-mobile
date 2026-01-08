# WorkB Mobile 코드 분석 종합 피드백

> 원본 리포트 + 내부/외부 리뷰를 통합한 최종 피드백 문서

---

## 1. 원본 리포트 평가

### 잘된 점
- 심각도별 분류(높음/중간/낮음)가 명확해서 우선순위 파악이 용이
- 정확한 파일 위치와 코드 스니펫 포함으로 즉시 조치 가능
- 우선순위별 권장 조치가 실행 가능한 액션 아이템으로 정리됨

### 보완 필요
- TODO 항목의 **비즈니스 임팩트** 분석 누락
- **테스트 커버리지** 분석 부재
- 각 이슈별 **조치 난이도/영향도/검증 방법** 미포함
- 근태관리 앱 특성상 중요한 **권한/오프라인/토큰 흐름** 점검 누락

---

## 2. 이슈 재분류 및 심층 분석

### 🔴 Critical: 출시 차단 이슈

#### C-1. JWT 토큰 평문 저장
| 항목 | 내용 |
|------|------|
| 위치 | `src/stores/authStore.ts:56-59` |
| 리스크 | 디바이스 분실/탈취, 루팅/탈옥, 백업 추출 시 토큰 노출 |
| 영향도 | 🔴 치명적 (계정 탈취, 출퇴근 조작 가능) |
| 난이도 | ⭐⭐ (2/5) |
| 예상 시간 | 4시간 |

**액션:**
```typescript
// AS-IS: AsyncStorage (평문)
await AsyncStorage.setItem('token', jwt);

// TO-BE: react-native-keychain (암호화)
import * as Keychain from 'react-native-keychain';
await Keychain.setGenericPassword('workb_user', jwt);
```

**마이그레이션 전략:**
1. 앱 시작 시 AsyncStorage에 토큰 존재 여부 확인
2. 존재하면 Keychain으로 이동 후 AsyncStorage에서 삭제
3. 이후 Keychain만 사용

**검증 방법:**
- [ ] 신규 설치 후 로그인 → Keychain 저장 확인
- [ ] 기존 사용자 업데이트 → 마이그레이션 동작 확인
- [ ] AsyncStorage에 토큰 잔존 여부 확인

---

#### C-2. 프로덕션 콘솔 로그 (107개)
| 항목 | 내용 |
|------|------|
| 위치 | 전체 소스 |
| 리스크 | 토큰/개인정보 노출, 성능 저하 |
| 영향도 | 🔴 높음 |
| 난이도 | ⭐ (1/5) |
| 예상 시간 | 2시간 |

**액션:**
```typescript
// src/utils/logger.ts 생성
const logger = {
  log: (...args: any[]) => __DEV__ && console.log(...args),
  error: (...args: any[]) => __DEV__ && console.error(...args),
  warn: (...args: any[]) => __DEV__ && console.warn(...args),
};
export default logger;
```

**대안:** `babel-plugin-transform-remove-console` 적용
```json
// babel.config.js
{
  "env": {
    "production": {
      "plugins": ["transform-remove-console"]
    }
  }
}
```

**검증 방법:**
- [ ] 프로덕션 빌드 후 Metro 번들에서 console.* 검색
- [ ] 실제 디바이스에서 로그 출력 없음 확인

---

#### C-3. DEV 우회 로직 프로덕션 노출 위험
| 항목 | 내용 |
|------|------|
| 위치 | `src/stores/attendanceStore.ts`, `src/app/screens/LoginScreen.tsx` |
| 리스크 | 프로덕션에서 인증/출퇴근 우회 가능 |
| 영향도 | 🔴 치명적 (근태 조작 = 급여 사고) |
| 난이도 | ⭐⭐ (2/5) |
| 예상 시간 | 3시간 |

**현재 문제:**
`__DEV__` 플래그만으로 우회 로직을 제어하면, 빌드 설정 실수 시 프로덕션에 노출될 수 있음

**액션 (권장):**
```typescript
// src/dev/devOnly.ts - 개발 전용 파일 분리
export const DEV_BYPASS_AUTH = true;
export const DEV_SKIP_LOCATION = true;

// 프로덕션 빌드 시 이 파일 import 자체가 실패하도록
// metro.config.js에서 resolver 설정
```

**최소 조치:**
```typescript
// 이중 검증
if (__DEV__ && process.env.ALLOW_DEV_BYPASS === 'true') {
  // 우회 로직
}
```

**검증 방법:**
- [ ] 프로덕션 빌드 → 우회 로직 실행 시도 → 실패 확인
- [ ] 빌드 로그에서 devOnly.ts 미포함 확인
- [ ] E2E 테스트에 "우회 동작 여부" 체크 추가

---

### 🟠 High: 출시 직후 사고 위험

#### H-1. OAuth Client ID 하드코딩
| 항목 | 내용 |
|------|------|
| 위치 | `src/app/screens/LoginScreen.tsx:40` |
| 리스크 | 환경별 분리 불가, 교체 시 재배포 필요 |
| 영향도 | 🟠 중간 (보안보다 **운영 편의성** 문제) |
| 난이도 | ⭐⭐ (2/5) |
| 예상 시간 | 2시간 |

**핵심 포인트:**
> Client ID는 비밀키가 아님. "숨기기"보다 **환경 분리/운영 편의성**이 목적.

**액션:**
```bash
# react-native-config 사용
# .env.development
GOOGLE_IOS_CLIENT_ID=xxx-dev.apps.googleusercontent.com

# .env.production  
GOOGLE_IOS_CLIENT_ID=xxx-prod.apps.googleusercontent.com
```

```typescript
import Config from 'react-native-config';
GoogleSignin.configure({
  iosClientId: Config.GOOGLE_IOS_CLIENT_ID,
});
```

**검증 방법:**
- [ ] DEV 빌드에서 DEV Client ID 사용 확인
- [ ] PROD 빌드에서 PROD Client ID 사용 확인

---

#### H-2. TODO 항목 출시 범위 미정의 (14개)
| 항목 | 내용 |
|------|------|
| 리스크 | "안 해도 되는 것" vs "반드시 해야 하는 것" 구분 없음 |
| 영향도 | 🟠 높음 (핵심 기능 누락 시 앱 사용 불가) |
| 난이도 | ⭐ (1/5) - 분류 작업 |
| 예상 시간 | 1시간 |

**TODO 분류 결과:**

| 분류 | 파일 | TODO 내용 | 판정 |
|------|------|-----------|------|
| 🔴 Must | NoticesScreen.tsx | API 호출 미구현 | 공지 못 보면 치명적 |
| 🔴 Must | ApprovalManagementScreen.tsx | API 호출 미구현 (4건) | 승인 불가 = 업무 마비 |
| 🔴 Must | AttendanceHistoryScreen.tsx | API 호출 미구현 | 출퇴근 기록 조회 불가 |
| 🟡 Post | HomeScreen.tsx:50 | 읽지 않은 공지 수 | 배지 없어도 기능 동작 |
| 🟡 Post | authStore.ts:213 | 프로필 API 연동 | 기본 정보만 있어도 사용 가능 |
| 🟡 Post | ErrorBoundary.tsx:53 | Crashlytics 연동 | 운영 편의 (출시 후 가능) |

**액션:**
- 🔴 Must 항목: 출시 전 완료 필수
- 🟡 Post 항목: v1.1 마일스톤으로 이동

---

#### H-3. 토큰 만료/재발급 시나리오 미검증
| 항목 | 내용 |
|------|------|
| 리스크 | 세션 만료 시 앱 먹통, 강제 로그아웃 없이 에러만 표시 |
| 영향도 | 🟠 높음 |
| 난이도 | ⭐⭐⭐ (3/5) |
| 예상 시간 | 6시간 |

**필요한 흐름:**
```
API 401 → Refresh Token으로 재발급 시도 
  → 성공: 새 토큰으로 원래 요청 재시도
  → 실패: 로그아웃 + 로그인 화면 이동
```

**검증 필요 사항:**
- [ ] Refresh Token 존재 여부 확인
- [ ] 401 인터셉터에서 토큰 갱신 로직 존재 여부
- [ ] Socket 연결 시 토큰 갱신 타이밍

---

#### H-4. 오프라인/네트워크 불안정 시 처리 미정의
| 항목 | 내용 |
|------|------|
| 리스크 | "출근 버튼 눌렀는데 통신 실패" → 기록 누락 → 급여 문제 |
| 영향도 | 🟠 높음 (근태앱 핵심 시나리오) |
| 난이도 | ⭐⭐⭐ (3/5) |
| 예상 시간 | 8시간 |

**권장 처리 방식:**
```typescript
// 1. 로컬 큐에 저장
await localQueue.add({ type: 'CHECK_IN', timestamp, location });

// 2. 네트워크 복구 시 자동 동기화
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    syncPendingRecords();
  }
});

// 3. 사용자에게 상태 표시
// "출근 기록됨 (서버 동기화 대기 중)"
```

---

#### H-5. 위치 권한 거부 시 UX 미정의
| 항목 | 내용 |
|------|------|
| 위치 | `src/services/LocationService.ts` |
| 리스크 | 권한 거부 시 앱 사용 불가 or 무한 로딩 |
| 영향도 | 🟠 높음 (민원 1순위) |
| 난이도 | ⭐⭐ (2/5) |
| 예상 시간 | 4시간 |

**처리해야 할 케이스:**
| 권한 상태 | 처리 |
|-----------|------|
| 허용 | 정상 동작 |
| 거부 | 설정 이동 안내 + 출퇴근 불가 메시지 |
| 한 번만 허용 | 앱 재시작 시 재요청 |
| 항상 허용 | 백그라운드 위치 사용 (필요시) |

---

### 🟡 Medium: 품질/유지보수 이슈

#### M-1. any 타입 사용 (20개 파일)
| 항목 | 내용 |
|------|------|
| 리스크 | 타입 안전성 저하, 런타임 에러 증가 |
| 난이도 | ⭐⭐ (2/5) |
| 예상 시간 | 4시간 |

**우선 처리 대상:**
- API 응답 타입 (가장 빈번한 any 사용처)
- 이벤트 핸들러 파라미터
- Socket 메시지 타입

---

#### M-2. useEffect 의존성 누락
| 항목 | 내용 |
|------|------|
| 위치 | `src/app/screens/HomeScreen.tsx:81` |
| 리스크 | 현재는 경고 수준, 로직 복잡해지면 버그 |
| 난이도 | ⭐ (1/5) |
| 예상 시간 | 1시간 |

**수정:**
```typescript
const fetchStatus = useCallback(async () => {
  // fetch 로직
}, [/* 필요한 의존성 */]);

useEffect(() => {
  fetchStatus();
  const timer = setInterval(() => setCurrentTime(new Date()), 1000);
  return () => clearInterval(timer);
}, [fetchStatus]);
```

---

### 🟢 Low: 개선 권장

#### L-1. HomeScreen 1초 타이머
| 항목 | 내용 |
|------|------|
| 위치 | `src/app/screens/HomeScreen.tsx` |
| 리스크 | 배터리 소모, 불필요한 리렌더 |
| 난이도 | ⭐ (1/5) |
| 예상 시간 | 1시간 |

**질문:** UI에 "초 단위" 표시가 진짜 필요한가?
- 필요 → `useFocusEffect`로 포커스일 때만 실행
- 불필요 → 분 단위로 변경 (60초 간격)

```typescript
import { useFocusEffect } from '@react-navigation/native';

useFocusEffect(
  useCallback(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [])
);
```

---

#### L-2. 사무실 좌표 하드코딩
| 항목 | 내용 |
|------|------|
| 위치 | `src/services/LocationService.ts:11-19` |
| 리스크 | 사무실 이전 시 앱 업데이트 필요 |
| 난이도 | ⭐ (1/5) |
| 예상 시간 | 2시간 |

**권장:** 서버에서 동적으로 받아오기
```typescript
// GET /api/office/location
// 앱 시작 시 또는 주기적으로 갱신
```

---

## 3. 원본 리포트에 누락된 핵심 점검 항목

### 추가 점검 필요 사항

| 항목 | 중요도 | 현재 상태 | 필요 조치 |
|------|--------|----------|----------|
| 네트워크 재시도 전략 | 🟠 | 미확인 | API 실패 시 재시도 로직 구현 여부 점검 |
| 에러 로깅/모니터링 | 🟠 | ErrorBoundary만 존재 | Sentry/Crashlytics 연동 |
| 딥링크/푸시 알림 | 🟡 | 미확인 | 공지 알림 탭 → 해당 화면 이동 |
| API 타임아웃 처리 | 🟢 | 30초 설정됨 | 사용자 피드백 UI 추가 권장 |

---

## 4. 수정된 종합 점수

### 원본 vs 재평가

| 분류 | 원본 점수 | 재평가 점수 | 사유 |
|------|----------|------------|------|
| 아키텍처 | 8/10 | 8/10 | 유지 (잘 구조화됨) |
| 코드 품질 | 7/10 | 6/10 | TODO Must 항목 미완성 반영 |
| 보안 | 6/10 | 5/10 | DEV 우회 위험 + 토큰 저장 |
| 성능 | 8/10 | 8/10 | 유지 |
| **운영 준비도** | - | 4/10 | 신규 항목 (오프라인, 권한, 에러로깅) |
| **종합** | 7.3/10 | **6.2/10** | 출시 전 필수 조치 후 재평가 필요 |

### 가중치 조정 근거

근태관리 앱 특성상:
- **보안** 가중치 상향 (출퇴근 조작 방지, 위치 위변조 방지)
- **운영 준비도** 항목 추가 (기록 누락 = 급여 문제)

---

## 5. 출시 전 필수 체크리스트

### 🔴 출시 차단 (Must Fix)

- [ ] Secure Storage로 토큰 이동 + 마이그레이션 로직
- [ ] logger 래퍼 적용 + prod 빌드에서 console 제거
- [ ] DEV 우회 로직: prod 빌드에서 **절대 실행 불가** 보장
- [ ] TODO Must 항목 (공지/승인/기록 API) 완료
- [ ] 프로덕션 빌드 후 우회 동작 E2E 검증

### 🟠 출시 권장 (Should Fix)

- [ ] OAuth Client ID 환경변수 분리
- [ ] 토큰 만료 → 재발급 → 실패 시 로그아웃 흐름 구현
- [ ] 위치 권한 거부 시 사용자 안내 UI
- [ ] 오프라인 출퇴근 로컬 저장 + 동기화

### 🟢 출시 후 (Nice to Have)

- [ ] HomeScreen 타이머 focus 기반 동작
- [ ] any 타입 구체화
- [ ] Crashlytics/Sentry 연동
- [ ] 사무실 좌표 서버 연동

---

## 6. 작업 티켓 (스프린트 투입용)

| # | 티켓 제목 | 난이도 | 예상 | 블로커 | 담당 |
|---|----------|--------|------|--------|------|
| 1 | [보안] JWT 토큰 Keychain 마이그레이션 | ⭐⭐ | 4h | 🔴 출시차단 | - |
| 2 | [보안] 프로덕션 콘솔 로그 제거 | ⭐ | 2h | 🔴 출시차단 | - |
| 3 | [보안] DEV 우회 로직 격리 및 검증 | ⭐⭐ | 3h | 🔴 출시차단 | - |
| 4 | [기능] 공지사항 API 연동 | ⭐⭐ | 4h | 🔴 출시차단 | - |
| 5 | [기능] 승인관리 API 연동 (4건) | ⭐⭐⭐ | 8h | 🔴 출시차단 | - |
| 6 | [기능] 출퇴근 기록 API 연동 | ⭐⭐ | 4h | 🔴 출시차단 | - |
| 7 | [설정] OAuth Client ID 환경변수 분리 | ⭐⭐ | 2h | 🟠 권장 | - |
| 8 | [인증] 토큰 만료/재발급 흐름 구현 | ⭐⭐⭐ | 6h | 🟠 권장 | - |
| 9 | [UX] 위치 권한 거부 시 안내 화면 | ⭐⭐ | 4h | 🟠 권장 | - |
| 10 | [기능] 오프라인 출퇴근 로컬 큐잉 | ⭐⭐⭐ | 8h | 🟠 권장 | - |

### 권장 작업 순서

```
1 → 2 → 3 (보안 기반)
    ↓
4 → 5 → 6 (핵심 기능)
    ↓
7 → 8 (인증 안정화)
    ↓
9 → 10 (UX 개선)
```

---

## 7. 결론

현재 WorkB Mobile은 **아키텍처와 성능은 양호**하나, **보안 및 운영 준비도에서 출시 차단 이슈**가 존재합니다.

**예상 추가 작업량:** 약 45시간 (출시 차단 25h + 권장 20h)

출시 차단 이슈 해결 후 재점검 시 **7.5/10 이상** 달성 가능할 것으로 판단됩니다.

---

*작성일: 2025-01-XX*  
*리뷰어: 내부 + 외부 통합*