# Lựa chọn chế độ làm lạnh dưới ràng buộc thời gian và năng lượng

## 1. short_answer

Một máy lạnh có hai chế độ: chế độ A lấy $540\,\mathrm{kJ}$ nhiệt mỗi chu trình, tiêu thụ $180\,\mathrm{kJ}$ công điện và mất $60\,\mathrm{s}$; chế độ B lấy $600\,\mathrm{kJ}$ nhiệt mỗi chu trình, tiêu thụ $240\,\mathrm{kJ}$ công điện và mất $40\,\mathrm{s}$. Tổng thời gian hoạt động không vượt quá $200\,\mathrm{s}$ và ngân sách công điện không vượt quá $800\,\mathrm{kJ}$. Yêu cầu lấy ít nhất $2160\,\mathrm{kJ}$ nhiệt. Hãy tính thời gian ngắn nhất có thể đạt được tải nhiệt này khi có thể sử dụng hỗn hợp các chu trình A và B (có thể chạy phần chu trình).



**Answer:** $\\frac{560}{3}\\,\\mathrm{s}\\ (\\approx 187\\,\\mathrm{s})$

Thời gian ngắn nhất đạt tải $2160\,\mathrm{kJ}$ thu được khi dùng $n_B=2$ chu trình B và $n_A=\frac{16}{9}$ chu trình A, cho thời gian $T=\frac{560}{3}\,\mathrm{s}\approx 187\,\mathrm{s}$, đáp ứng cả giới hạn thời gian và ngân sách công điện.

## 2. selection

Xác định trong các trường hợp sau, trường hợp nào cho phép đạt tải nhiệt $2160\,\mathrm{kJ}$ mà không vi phạm bất kỳ ràng buộc nào: (i) chỉ dùng chế độ B, (ii) kết hợp chế độ A và B, (iii) chỉ dùng chế độ A. Các ràng buộc: tổng thời gian hoạt động không vượt quá $200\,\mathrm{s}$, ngân sách điện không vượt quá $800\,\mathrm{kJ}$. Mỗi chu trình A lấy $540\,\mathrm{kJ}$ nhiệt, tiêu thụ $180\,\mathrm{kJ}$ điện và mất $60\,\mathrm{s}$; mỗi chu trình B lấy $600\,\mathrm{kJ}$ nhiệt, tiêu thụ $240\,\mathrm{kJ}$ điện và mất $40\,\mathrm{s}$. Phép chia chu trình được phép (có thể dùng phần chu trình).

- Kết hợp chế độ A và B có thể đáp ứng được tất cả các ràng buộc.
- Chỉ dùng chế độ A có thể đáp ứng được yêu cầu nếu sử dụng phần chu trình.
- Chỉ dùng chế độ B không đáp ứng được ràng buộc năng lượng.
- Kết hợp chế độ A và B luôn vi phạm một trong các ràng buộc, bất kể cách phân bổ chu trình.

**Answer:** ["Kết hợp chế độ A và B có thể đáp ứng được tất cả các ràng buộc.","Chỉ dùng chế độ B không đáp ứng được ràng buộc năng lượng."]

Bằng cách giải hệ bất phương trình, ta thấy có nghiệm khả thi khi kết hợp cả hai chế độ (ví dụ $x\approx2.30$, $y\approx1.55$). Chế độ B đơn độc vi phạm ngân sách điện và chế độ A đơn độc vi phạm thời gian, do đó chỉ có hai phát biểu đúng trong các lựa chọn.

## 3. multiple_choice

Một máy lạnh có hai chế độ hoạt động:
- Chế độ A: mỗi chu trình lấy $540\,\mathrm{kJ}$ nhiệt từ ngăn lạnh, tiêu thụ $180\,\mathrm{kJ}$ công điện và mất $60\,\mathrm{s}$.
- Chế độ B: mỗi chu trình lấy $600\,\mathrm{kJ}$ nhiệt, tiêu thụ $240\,\mathrm{kJ}$ công điện và mất $40\,\mathrm{s}$.
Tải nhiệt cần lấy là $2160\,\mathrm{kJ}$. Tổng thời gian hoạt động không được vượt quá $200\,\mathrm{s}$, ngân sách điện không vượt quá $800\,\mathrm{kJ}$ và hệ số hiệu suất trung bình của toàn bộ quá trình phải không dưới $2,5$. Các chu trình có thể được thực hiện một phần (số chu trình $x_A$, $x_B \ge 0$). Trong các khẳng định sau, khẳng định nào mô tả đúng khả năng đạt tải nhiệt $2160\,\mathrm{kJ}$ đồng thời thỏa mãn mọi ràng buộc?

- Không thể đạt tải 2160 kJ vì thời gian tối đa 200 s bị vượt quá.
- Có thể đạt tải 2160 kJ chỉ bằng cách sử dụng 4 chu trình chế độ A.
- Có thể đạt tải 2160 kJ nếu bỏ qua ràng buộc COP trung bình.
- Có thể đạt tải 2160 kJ bằng cách thực hiện 2 chu trình chế độ A và 1,8 chu trình chế độ B, đáp ứng mọi ràng buộc.

**Answer:** Có thể đạt tải 2160 kJ bằng cách thực hiện 2 chu trình chế độ A và 1,8 chu trình chế độ B, đáp ứng mọi ràng buộc.

Giải hệ bất đẳng thức cho $x_A$, $x_B$ cho thấy điểm biên $9x_A+10x_B=36$ cùng với ràng buộc thời gian $3x_A+2x_B\le10$ và năng lượng $3x_A+4x_B\le13.33$ cho phép $x_B$ trong khoảng $1.5\le x_B\le2$. Lấy $x_B=1.8$ suy ra $x_A=2$. Kiểm tra: thời gian $60(2)+40(1.8)=192\ \mathrm{s}\le200\ \mathrm{s}$; năng lượng $180(2)+240(1.8)=792\ \mathrm{kJ}\le800\ \mathrm{kJ}$; nhiệt $540(2)+600(1.8)=2160\ \mathrm{kJ}$; COP trung bình $=\frac{2160}{792}\approx2.73\ge2.5$. Vì tồn tại nghiệm thỏa mãn, tải $2160\ \mathrm{kJ}$ có thể đạt được bằng cách thực hiện 2 chu trình chế độ A và 1,8 chu trình chế độ B.