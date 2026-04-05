const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const path = require('path');
const nodemailer = require('nodemailer'); // Thêm thư viện mail
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// CẤU HÌNH GỬI EMAIL (Thay thông tin của bạn vào đây)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'legiakhanhdz2011@gmail.com', 
        pass: 'yhyr xmnv qcva sbkc' 
    }
});

// 1. API: Đăng ký
app.post('/register', (req, res) => {
    const { name, email } = req.body;
    db.run(`INSERT INTO users (name, email) VALUES (?, ?)`, [name, email], function(err) {
        if (err) return res.send("Lỗi! Email này đã tồn tại.");
        res.send(`
            <div style="font-family:Arial; text-align:center; margin-top:50px;">
                <h2 style="color:#28a745;">Đăng ký thành công!</h2>
                <p>Vui lòng chờ Admin duyệt. Key sẽ được gửi tự động về Email của bạn.</p>
                <a href="/">Quay lại</a>
            </div>
        `);
    });
});

// 2. API: Admin (Đã làm đẹp bảng)
app.get('/admin', (req, res) => {
    db.all(`SELECT * FROM users`, [], (err, rows) => {
        let html = `
        <style>
            table { width: 90%; border-collapse: collapse; margin: 20px auto; font-family: Arial; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #007bff; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .btn { padding: 8px 12px; background: #28a745; color: white; text-decoration: none; border-radius: 4px; }
        </style>
        <h1 style="text-align:center;">Bảng Điều Khiển Admin</h1>
        <table>
            <tr><th>ID</th><th>Tên</th><th>Email</th><th>Trạng thái</th><th>Key</th><th>Lượt tải</th><th>Hành động</th></tr>`;
        rows.forEach(user => {
            html += `<tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><b>${user.status}</b></td>
                <td><code>${user.key || '-'}</code></td>
                <td>${user.downloads}</td>
                <td>${user.status === 'pending' ? `<a class="btn" href="/approve/${user.id}">Duyệt & Gửi Mail</a>` : 'Đã duyệt'}</td>
            </tr>`;
        });
        html += '</table>';
        res.send(html);
    });
});

// 3. API: Duyệt và TỰ ĐỘNG GỬI MAIL
app.get('/approve/:id', (req, res) => {
    const userId = req.params.id;
    const randomKey = "KEY-" + Math.random().toString(36).substring(2, 10).toUpperCase(); 
    
    db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, user) => {
        if (user) {
            db.run(`UPDATE users SET status = 'approved', key = ? WHERE id = ?`, [randomKey, userId], function(err) {
                // Gửi email thông báo
                const mailOptions = {
                    from: 'Hệ thống Tải File',
                    to: user.email,
                    subject: 'Yêu cầu tải file của bạn đã được duyệt!',
                    text: `Chào ${user.name}, yêu cầu của bạn đã được duyệt. Mã Key của bạn là: ${randomKey}`
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) console.log(error);
                    res.redirect('/admin');
                });
            });
        }
    });
});

// 4. API: Tải file (Nhớ sửa tên file của bạn ở đây)
app.get('/download', (req, res) => {
    const userKey = req.query.key;
    db.get(`SELECT * FROM users WHERE key = ? AND status = 'approved'`, [userKey], (err, user) => {
        if (err || !user) return res.status(403).send("Key không hợp lệ!");
        db.run(`UPDATE users SET downloads = downloads + 1 WHERE key = ?`, [userKey]);
        const filePath = path.join(__dirname, 'files', 'app.zip'); // ĐỔI TÊN FILE CỦA BẠN TẠI ĐÂY
        res.download(filePath);
    });
});

app.listen(3000, () => console.log('Web đang chạy tại: http://localhost:3000'));