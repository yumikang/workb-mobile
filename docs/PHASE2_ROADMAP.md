# WORKB Phase 2 로드맵

## 1. 기기 인증 시스템

### 목표
- 출퇴근 시 승인된 기기에서만 체크 가능하도록 제한
- 대리 출퇴근 방지

### 구현 내용

#### 모바일 앱
- [ ] 기기 UUID 수집 및 저장
- [ ] 출퇴근 시 기기 UUID 함께 전송
- [ ] 미인증 기기 알림 표시

#### 어드민 웹
- [ ] 직원별 허용 기기 목록 관리
- [ ] 기기 등록/삭제/비활성화
- [ ] 기기 인증 로그 조회

#### 백엔드
- [ ] 기기 테이블 (devices)
- [ ] 출퇴근 시 기기 검증 미들웨어
- [ ] 기기 관리 API

### 데이터 모델
```typescript
interface Device {
  id: string;
  userId: string;
  deviceId: string;        // UUID
  deviceName: string;      // "iPhone 15 Pro"
  platform: 'ios' | 'android';
  isApproved: boolean;
  registeredAt: Date;
  lastUsedAt: Date;
}
```

---

## 2. 승인 구조 설정 (휴가 + 근태정정 통합)

### 목표
- 어드민에서 워크스페이스별 승인 구조 선택 가능
- 단순/계층 구조 전환
- **휴가 신청 + 근태 정정 모두 동일 승인 구조 적용**

### 현재 상태 (MVP)
| 기능 | 상태 |
|------|------|
| 휴가 신청 (LeaveScreen) | 신청만 가능, 승인 라우팅 없음 |
| 근태 정정 (AttendanceCorrectionScreen) | 신청만 가능, 승인 라우팅 없음 |
| 승인 관리 (ApprovalManagementScreen) | 목업 데이터, API 연동 X |
| 승인 흐름 | 모든 요청 → HR/Admin (백엔드에서 처리) |

### 구현 내용

#### 모바일 앱
- [ ] 휴가 신청 시 승인자 표시 (누구에게 요청되는지)
- [ ] 근태 정정 시 승인자 표시
- [ ] 승인 상태 실시간 업데이트 (소켓 연동)
- [ ] 승인/반려 푸시 알림

#### 어드민 웹
- [ ] 워크스페이스 설정 > 승인 구조 설정 페이지
- [ ] 단순 구조 / 계층 구조 선택
- [ ] 계층 구조 시 승인 라인 설정
- [ ] 승인 권한자 목록 관리

#### 백엔드
- [ ] 워크스페이스 설정 테이블 확장
- [ ] 승인 라우팅 로직 (휴가 + 근태 정정 공통)
- [ ] 다단계 승인 상태 관리
- [ ] 승인자 변경 시 알림

### 승인 구조 옵션
```typescript
interface ApprovalSettings {
  workspaceId: string;
  approvalType: 'simple' | 'hierarchical';

  // 단순 구조: 모든 요청 → HR/Admin
  simpleApprovers: ('admin' | 'hr')[];

  // 계층 구조
  hierarchicalFlow?: {
    employee: 'manager';      // 직원 → 팀장
    manager: 'hr' | 'admin';  // 팀장 → HR/Admin
    hr: 'admin';              // HR → Admin (선택)
  };

  // 자동 승인 설정 (선택)
  autoApprove?: {
    correctionUnder30min: boolean;  // 30분 이내 정정 자동승인
    leaveUnder1day: boolean;        // 1일 이내 휴가 자동승인
  };
}

// 승인 대상 타입 (휴가 + 근태정정 공통)
type ApprovalTargetType = 'leave' | 'attendance_correction';
```

### MVP vs Phase 2 비교
| 항목 | MVP (현재) | Phase 2 |
|------|-----------|---------|
| 휴가 승인 | HR/Admin만 (고정) | 팀장 → HR/Admin (설정 가능) |
| 근태 정정 승인 | HR/Admin만 (고정) | 팀장 → HR/Admin (설정 가능) |
| 승인 구조 설정 | 불가 | 어드민에서 설정 |
| 자동 승인 | 불가 | 조건부 자동 승인 가능 |

---

## 3. 기타 Phase 2 후보

### 모바일
- [ ] 위치 기반 출퇴근 (지오펜싱)
- [ ] 생체 인증 (Face ID / 지문)
- [ ] 오프라인 모드 지원

### 어드민
- [ ] 근태 통계 대시보드
- [ ] 엑셀 내보내기
- [ ] 알림 설정 커스터마이징

### 백엔드
- [ ] 푸시 알림 (FCM)
- [ ] 실시간 동기화 (Socket.io)
- [ ] 감사 로그 (Audit Log)

---

## 우선순위

1. **기기 인증** - 보안상 필수
2. **계층형 승인** - 중소기업 대응
3. 위치 기반 출퇴근 - 현장직 대응
4. 통계/리포트 - 관리 편의성
