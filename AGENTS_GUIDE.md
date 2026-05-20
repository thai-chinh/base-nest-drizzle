# Hướng dẫn sử dụng Agents trong Cursor

## 📋 Tổng quan

Thư mục `.cursor/` chứa các **agents** (chuyên gia) và **skills** (kỹ năng) để hỗ trợ phát triển. Bạn không cần nhớ từng skill, chỉ cần sử dụng đúng agent cho từng công việc.

## 🎯 Các Agents và vai trò

### 1. **Planner** - Người lập kế hoạch
**File:** `.cursor/agents/planner.md`

**Khi nào dùng:**
- Lập kế hoạch tính năng mới
- Phân tích requirements
- Đề xuất architecture tổng thể
- Break down tasks

**Ví dụ:**
```bash
#File: .cursor/agents/planner.md
# Yêu cầu: "Tôi cần tạo tính năng quản lý đơn hàng với các bước: tạo đơn, thanh toán, vận chuyển"
```

### 2. **Architect** - Kiến trúc sư
**File:** `.cursor/agents/architect.md`

**Khi nào dùng:**
- Thiết kế database schema
- Thiết kế API structure
- Thiết kế module structure
- System design

**Ví dụ:**
```bash
#File: .cursor/agents/architect.md
# Yêu cầu: "Thiết kế schema cho hệ thống đơn hàng với quan hệ users → orders → order_items"
```

### 3. **Database Reviewer** - Chuyên gia Database
**File:** `.cursor/agents/database-reviewer.md`

**Khi nào dùng:**
- Thiết kế bảng, schema
- Viết queries phức tạp
- Tối ưu performance
- Review migrations
- PostgreSQL best practices

**Ví dụ:**
```bash
#File: .cursor/agents/database-reviewer.md
# Yêu cầu: "Review query này có tối ưu không: SELECT * FROM orders WHERE user_id = ? AND status = ?"
```

### 4. **Code Reviewer** - Người review code
**File:** `.cursor/agents/code-reviewer.md`

**Khi nào dùng:**
- Review code trước khi commit
- Đảm bảo code quality
- Check type safety
- Phát hiện bug tiềm ẩn

**Ví dụ:**
```bash
#File: .cursor/agents/code-reviewer.md
# Yêu cầu: "Review code service xử lý đơn hàng tôi vừa viết"
```

### 5. **Security Reviewer** - Chuyên gia bảo mật
**File:** `.cursor/agents/security-reviewer.md`

**Khi nào dùng:**
- Review security issues
- Xử lý authentication/authorization
- Validate user input
- Check file upload security
- API security

**Ví dụ:**
```bash
#File: .cursor/agents/security-reviewer.md
# Yêu cầu: "Check security cho API upload file và xử lý thanh toán"
```

### 6. **TDD Guide** - Hướng dẫn TDD
**File:** `.cursor/agents/tdd-guide.md`

**Khi nào dùng:**
- Viết tests theo TDD
- Đảm bảo test coverage 80%+
- Hướng dẫn test structure
- Mocking external services

**Ví dụ:**
```bash
#File: .cursor/agents/tdd-guide.md
# Yêu cầu: "Hướng dẫn viết tests cho service xử lý đơn hàng theo TDD"
```

### 7. **Build Error Resolver** - Xử lý lỗi build
**File:** `.cursor/agents/build-error-resolver.md`

**Khi nào dùng:**
- Fix lỗi TypeScript compilation
- Fix lỗi dependency
- Resolve build issues
- Debug runtime errors

**Ví dụ:**
```bash
#File: .cursor/agents/build-error-resolver.md
# Yêu cầu: "Fix lỗi TypeScript: Cannot find module '@/core/database'"
```

### 8. **Refactor Cleaner** - Dọn dẹp code
**File:** `.cursor/agents/refactor-cleaner.md`

**Khi nào dùng:**
- Refactor code
- Remove duplication
- Improve code structure
- Clean up technical debt

**Ví dụ:**
```bash
#File: .cursor/agents/refactor-cleaner.md
# Yêu cầu: "Refactor service này để giảm complexity và improve readability"
```

### 9. **Typescript Reviewer** - Chuyên gia TypeScript
**File:** `.cursor/agents/typescript-reviewer.md`

**Khi nào dùng:**
- Review TypeScript type safety
- Check async/await patterns
- Ensure idiomatic TypeScript
- Prevent common TypeScript mistakes

**Ví dụ:**
```bash
#File: .cursor/agents/typescript-reviewer.md
# Yêu cầu: "Review TypeScript types và async handling trong module này"
```

## 🚀 Workflow đơn giản

### **Luôn có trong context:**
```bash
#File: .cursor/RULES.md
#File: .cursor/CLAUDE.md
```
Hai file này chứa **tất cả quy tắc bắt buộc** của project.

### **Ví dụ workflow tạo tính năng mới:**

**Bước 1: Lập kế hoạch**
```bash
#File: .cursor/agents/planner.md
# Yêu cầu: "Tôi cần tạo tính năng quản lý blog với posts, categories, comments"
```

**Bước 2: Thiết kế database**
```bash
#File: .cursor/agents/architect.md
# Hoặc
#File: .cursor/agents/database-reviewer.md
# Yêu cầu: "Thiết kế schema cho blog system theo quy tắc project"
```

**Bước 3: Implement code**
```bash
# Không cần tag gì cả, cứ code bình thường
# Nhưng luôn có RULES.md và CLAUDE.md trong context
```

**Bước 4: Viết tests**
```bash
#File: .cursor/agents/tdd-guide.md
# Yêu cầu: "Hướng dẫn viết tests cho blog feature theo TDD"
```

**Bước 5: Review code**
```bash
#File: .cursor/agents/code-reviewer.md
# Yêu cầu: "Review toàn bộ code blog feature"
```

**Bước 6: Security review**
```bash
#File: .cursor/agents/security-reviewer.md
# Yêu cầu: "Check security cho API blog (create post, upload image, comments)"
```

## 🎪 Các Skills (tự động được sử dụng)

Các agents sẽ tự động sử dụng skills phù hợp:

| Agent | Skills được sử dụng |
|-------|-------------------|
| Planner | Tất cả skills liên quan |
| Architect | api-design, nestjs-patterns, drizzle-patterns |
| Database Reviewer | drizzle-patterns, database-migrations |
| Code Reviewer | typescript-patterns, error-handling |
| Security Reviewer | security-review |
| TDD Guide | tdd-workflow |

**Bạn không cần tag skills trực tiếp**, agents sẽ tự động sử dụng chúng.

## 📝 Mẹo sử dụng hiệu quả

### **1. Khi không biết dùng agent nào:**
```bash
#File: .cursor/agents/planner.md
```
Planner là agent tổng quát nhất, sẽ hướng dẫn bạn từng bước.

### **2. Khi cần chuyên sâu:**
- Database → `database-reviewer.md`
- API design → `architect.md` 
- Code quality → `code-reviewer.md`
- Security → `security-reviewer.md`
- Testing → `tdd-guide.md`

### **3. Luôn bắt đầu với:**
```bash
#File: .cursor/RULES.md
#File: .cursor/CLAUDE.md
```
Đảm bảo tuân thủ quy tắc project.

### **4. Một agent cho một công việc:**
Không cần tag nhiều agents cùng lúc. Mỗi agent đã được training để xử lý công việc chuyên biệt.

## 🔧 Các file quan trọng khác

### **RULES.md** - Quy tắc bắt buộc
- Tech stack: NestJS + Fastify, Drizzle ORM, PostgreSQL, Redis, MinIO
- ID strategy: Snowflake bigint (không UUID)
- Architecture patterns
- Coding standards

### **CLAUDE.md** - Project context
- Commands (yarn start:dev, yarn db:generate, etc.)
- Key files location
- Project structure
- Workflow

### **Skills/** - Kỹ năng chuyên sâu
- `drizzle-patterns/` - Drizzle ORM patterns
- `nestjs-patterns/` - NestJS best practices
- `api-design/` - API design patterns
- `database-migrations/` - Database migration patterns
- `security-review/` - Security best practices
- `tdd-workflow/` - Test-driven development

## ❓ FAQ

### **Q: Tôi có cần tag skills không?**
**A:** Không. Chỉ cần tag agent, agent sẽ tự động sử dụng skills cần thiết.

### **Q: Có cần tag nhiều agents cùng lúc không?**
**A:** Không. Mỗi agent đủ mạnh để xử lý công việc chuyên biệt.

### **Q: Làm sao biết agent nào phù hợp?**
**A:** Xem bảng "Các Agents và vai trò" ở trên, hoặc dùng `planner.md` - agent này sẽ hướng dẫn bạn.

### **Q: Có cần đọc hết các skills không?**
**A:** Không. Agents đã được training trên các skills đó.

## 🆘 Khi gặp vấn đề

1. **Build errors** → `build-error-resolver.md`
2. **TypeScript errors** → `typescript-reviewer.md`
3. **Database issues** → `database-reviewer.md`
4. **Security concerns** → `security-reviewer.md`
5. **Code quality** → `code-reviewer.md`
6. **Không biết bắt đầu từ đâu** → `planner.md`

---

**Tóm lại:** Chỉ cần nhớ tag đúng agent cho công việc, và luôn có `RULES.md` + `CLAUDE.md` trong context. Cursor sẽ làm phần còn lại!

*File này không commit vào git (đã thêm vào .gitignore)*