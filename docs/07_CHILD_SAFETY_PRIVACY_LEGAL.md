# BẢO VỆ TRẺ EM, QUYỀN RIÊNG TƯ VÀ PHÁP LÝ

**Phiên bản:** 1.0  
**Ngày:** 23/06/2026  
**Dự án:** HaMi Code Việt - hamicodeviet.com

---

## 1. Mục đích

Hồ sơ này thiết lập baseline về bảo vệ trẻ em, quyền riêng tư, AI safety và compliance. Đây không phải ý kiến pháp lý cuối cùng; trước khi mở thị trường hoặc thanh toán quốc tế phải có review của cố vấn pháp lý theo từng jurisdiction.

## 2. Nền tảng pháp lý tham chiếu

- Luật Bảo vệ dữ liệu cá nhân Việt Nam số 91/2025/QH15, ban hành 26/06/2025, hiệu lực 01/01/2026.
- COPPA và Final Rule Amendments của FTC đối với dịch vụ hướng tới trẻ dưới 13 tuổi tại Hoa Kỳ.
- Hướng dẫn UNESCO về AI tạo sinh trong giáo dục, bao gồm khuyến nghị age-appropriate use và ngưỡng 13 tuổi trong hướng dẫn năm 2023.

Team legal phải xác định cụ thể phạm vi áp dụng, cơ sở xử lý, consent, data transfer, thuế, thương mại điện tử và lao động/creator payout.

## 3. Age-aware account model

| Nhóm | Mô hình |
|---|---|
| 8-12 | Child account + guardian verified consent; không chat AI mở; public portfolio off |
| 13-17 | Teen account + guardian flow theo policy/jurisdiction; quyền công khai hạn chế |
| 18-24 | Adult account; vẫn áp dụng privacy, safety và creator terms |

Không thu thập ảnh giấy tờ tùy thân nếu chưa có căn cứ rõ, vendor an toàn, retention ngắn và quy trình xóa.

## 4. Consent requirements

Consent record gồm:

- Subject và guardian IDs.
- Policy version.
- Purpose.
- Data categories.
- Timestamp, locale, method.
- Verification status.
- Withdrawal date.
- Evidence hash/reference.

Không gộp consent cần thiết với marketing consent. Rút consent phải dễ và không gây dark pattern.

## 5. Privacy by design

- Data minimization.
- Purpose limitation.
- Retention schedule.
- Default private.
- Encryption in transit/at rest theo risk.
- Access logging.
- Export, correction, deletion workflows.
- Vendor inventory và data processing agreements.
- Breach response và notification workflow.
- Không bán dữ liệu và không behavioral ads cho trẻ.

## 6. Child safety controls

- Report abuse ở mọi khu vực cộng đồng.
- Không direct messaging mở trong MVP.
- Block/filter PII trong bài đăng công khai.
- Moderation queue, escalation và safeguarding owner.
- Community guidelines, strike/suspension, appeal.
- Không hiển thị trường học, địa chỉ, số điện thoại, vị trí hoặc lịch sinh hoạt.
- Media consent riêng cho ảnh/video trẻ em.

## 7. AI safety theo độ tuổi

- Dưới 13: guided tools, closed prompts, teacher/guardian mode.
- 13-17: scoped tutor, content filters, no unrestricted agent actions.
- 18+: broader tools nhưng vẫn audit, quota và policy.
- AI output phải ghi rõ có thể sai; người học được dạy kiểm chứng.

## 8. Marketplace minors

- Creator dưới 18 phải gắn guardian account.
- Contract, payout, tax và dispute do người đại diện hợp pháp quản lý theo pháp luật áp dụng.
- Không payout trực tiếp cho child account.
- Kiểm soát copyright, open-source licenses, AI-generated assets và third-party resources.

## 9. Policy pack cần có

- Privacy Policy.
- Child Privacy Notice.
- Parent/Guardian Consent.
- Terms of Service.
- Acceptable Use Policy.
- AI Use Policy.
- Community Guidelines.
- Marketplace Terms.
- Creator Agreement.
- Refund Policy.
- Copyright/Takedown Policy.
- Data Retention Policy.
- Cookie Policy.
- Security Disclosure Policy.
- School/Teacher Agreement.

Mỗi policy có owner, version, effective date, change log và review cycle.
