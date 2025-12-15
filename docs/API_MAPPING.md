# WORKB Mobile - API & DB 매핑 문서

> 모바일 앱과 어드민 백엔드(codeb_project-main) 간의 데이터 매핑 정의

## 1. 게시판 (Board)

> 모바일 앱의 "게시판" = 어드민 DB의 `Board` 모델 사용

### 모바일 타입 → DB 모델

| 모바일 (`Notice`) | 어드민 DB (`Board`) | 비고 |
|------------------|---------------------|------|
| `id` | `id` | UUID |
| `title` | `title` | |
| `content` | `content` | |
| `author` | → `authorId` → `User.name` | JOIN 필요 |
| `authorId` | `authorId` | |
| `isPinned` | `isPinned` | |
| `isNew` | (계산) | `createdAt` 기준 24시간 이내 |
| `isRead` | ❌ **없음** | 로컬 저장 또는 별도 테이블 필요 |
| `createdAt` | `createdAt` | |
| `workspaceId` | `workspaceId` | |
| - | `category` | 카테고리 분류 (선택) |

### 필요 API 엔드포인트

```
GET    /api/workspaces/:workspaceId/boards
GET    /api/workspaces/:workspaceId/boards/:id
POST   /api/workspaces/:workspaceId/boards                 (관리자 전용)
PATCH  /api/boards/:id                                     (관리자 전용)
PATCH  /api/boards/:id/pin                                 (관리자 전용)
DELETE /api/boards/:id                                     (관리자 전용)
```

### 댓글 기능 (BoardComment 모델 사용)

어드민 DB에 이미 `BoardComment` 모델이 존재함:

| 모바일 (`Comment`) | 어드민 DB (`BoardComment`) | 비고 |
|-------------------|---------------------------|------|
| `id` | `id` | UUID |
| `authorId` | `authorId` | |
| `authorName` | → `User.name` | JOIN 필요 |
| `content` | `content` | |
| `createdAt` | `createdAt` | |

```
GET    /api/boards/:id/comments
POST   /api/boards/:id/comments
DELETE /api/boards/:boardId/comments/:commentId
```

---

## 2. 휴가 관리 (Leave)

### 모바일 타입 → DB 모델

| 모바일 (`LeaveRequest`) | 어드민 DB (`LeaveRequest`) | 비고 |
|------------------------|---------------------------|------|
| `id` | `id` | |
| `type` | `type` (LeaveType enum) | |
| `startDate` | `startDate` | |
| `endDate` | `endDate` | |
| `days` | `days` | 0.5 = 반차 |
| `reason` | `reason` | |
| `status` | `status` (LeaveStatus enum) | |

### LeaveType enum 매핑

| 모바일 | 어드민 DB |
|-------|---------|
| `annual` | `ANNUAL` |
| `sick` | `SICK` |
| `half_am` | `HALF_AM` |
| `half_pm` | `HALF_PM` |
| `personal` | `SPECIAL` |

### LeaveStatus enum 매핑

| 모바일 | 어드민 DB |
|-------|---------|
| `pending` | `PENDING` |
| `approved` | `APPROVED` |
| `rejected` | `REJECTED` |

### 휴가 잔여일수

| 모바일 (`LeaveBalance`) | 어드민 DB (`LeaveBalance`) |
|------------------------|---------------------------|
| `annual.total` | `annualTotal` |
| `annual.used` | `annualUsed` |
| `annual.remaining` | `annualTotal - annualUsed` (계산) |
| `sick.total` | `sickTotal` |
| `sick.used` | `sickUsed` |
| `sick.remaining` | `sickTotal - sickUsed` (계산) |

### 필요 API 엔드포인트

```
GET    /api/workspaces/:workspaceId/leave/balance?employeeId=xxx&year=2025
GET    /api/workspaces/:workspaceId/leave/requests?employeeId=xxx&year=2025
POST   /api/workspaces/:workspaceId/leave/requests
PATCH  /api/leave/requests/:id/cancel
```

---

## 3. 출퇴근 (Attendance)

### 모바일 타입 → DB 모델

| 모바일 (`AttendanceRecord`) | 어드민 DB (`Attendance`) | 비고 |
|---------------------------|------------------------|------|
| `id` | `id` | |
| `userId` | `userId` | |
| `date` | `date` | |
| `checkInTime` | `checkIn` | |
| `checkOutTime` | `checkOut` | |
| `status` | `status` (AttendanceStatus) | |
| `workLocation` | ❌ **없음** | 추가 필요 |

### AttendanceStatus enum 매핑

| 모바일 | 어드민 DB | 비고 |
|-------|---------|------|
| `working` | `PRESENT` | |
| `out` | - | checkOut이 있으면 퇴근 |
| `loading` | - | 클라이언트 전용 상태 |

### 추가 필요 필드 (어드민 DB)

```prisma
// Attendance 모델에 추가
workLocation  String?  // "office" | "remote" | "field"
```

### 필요 API 엔드포인트

```
GET    /api/workspaces/:workspaceId/attendance/today?userId=xxx
POST   /api/workspaces/:workspaceId/attendance/check-in
POST   /api/workspaces/:workspaceId/attendance/check-out
GET    /api/workspaces/:workspaceId/attendance/history?userId=xxx&month=2025-01
```

---

## 4. 사용자 및 권한 (User & Role)

### 모바일 타입 → DB 모델

| 모바일 (`User`) | 어드민 DB | 비고 |
|----------------|---------|------|
| `id` | `User.id` | |
| `email` | `User.email` | |
| `displayName` | `User.name` | |
| `role` | `WorkspaceMember.role` | 워크스페이스별 권한 |
| `photoURL` | `User.avatar` | |
| `workspaceId` | `WorkspaceMember.workspaceId` | |
| `teamId` | `TeamMember.teamId` | |
| `department` | `Team.name` 또는 `Employee.department` | |

### Role 매핑

| 모바일 | 어드민 DB | 처리 방법 |
|-------|---------|----------|
| `owner` | - | 워크스페이스 생성자로 별도 관리 |
| `admin` | `Role.admin` | WorkspaceMember.role |
| `leader` | - | TeamMember.role = 'leader' |
| `member` | `Role.member` | WorkspaceMember.role |
| `guest` | - | 별도 처리 필요 |

### 필요 API 엔드포인트

```
GET    /api/auth/me                    (현재 사용자 정보)
POST   /api/auth/login
POST   /api/auth/google
POST   /api/auth/logout
PATCH  /api/users/:id/profile
```

---

## 5. 실시간 이벤트 (Socket.io)

### 이벤트 매핑

| 모바일 이벤트 | 서버 → 클라이언트 |
|-------------|-----------------|
| `attendance:checkin` | 출근 알림 |
| `attendance:checkout` | 퇴근 알림 |
| `attendance:status_changed` | 상태 변경 |
| `leave:requested` | 휴가 신청됨 |
| `leave:approved` | 휴가 승인됨 |
| `leave:rejected` | 휴가 반려됨 |
| `board:created` | 새 게시글 |
| `board:updated` | 게시글 수정됨 |
| `presence:check_required` | 재실 확인 요청 |

---

## 6. FCM 푸시 알림

### 알림 타입

| type | 용도 | 이동 화면 |
|------|------|----------|
| `attendance` | 출퇴근 알림 | Home |
| `leave` | 휴가 승인/반려 | Leave |
| `board` | 새 게시글 | BoardDetail |
| `presence_check` | 재실 확인 | Home |
| `general` | 일반 알림 | - |

---

## 7. 어드민 DB 수정 필요 사항

### 추가해야 할 모델

1. **BoardRead** (선택) - 게시글 읽음 상태 추적용

### 추가해야 할 필드

1. **Attendance.workLocation** - 근무 위치 (office/remote/field)
2. **User 또는 WorkspaceMember** - 더 세분화된 역할 (leader, guest 등)

### enum 추가/수정

```prisma
enum WorkLocation {
  OFFICE
  REMOTE
  FIELD
}
```

---

## 8. 목 데이터 위치

현재 DEV 모드에서 사용 중인 목 데이터:

| 파일 | 목 데이터 | 라인 |
|------|----------|------|
| `NoticesScreen.tsx` | `mockNotices` (게시글 3개) | 31-68 |
| `NoticeDetailScreen.tsx` | `mockComments` (댓글 2개) | 46-61 |
| `HomeScreen.tsx` | 근무시간 목업 (주간/월간) | workHoursSection |
| `LoginScreen.tsx` | DEV 유저 2명 (직원/관리자) | DEV 버튼 내 |

---

*최종 업데이트: 2025-12-15*
