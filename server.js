// FILE: server.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();

// Allow form data
app.use(express.urlencoded({ extended: true }));

// Setup session
app.use(session({
    secret: "mysecretkey",
    resave: false,
    saveUninitialized: true
}));

// Load users from file
let users = JSON.parse(fs.readFileSync("users.json", "utf8"));

// Serve public folder
app.use(express.static(path.join(__dirname, "public")));

// Home route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    users.push({ username, password: hashedPassword });

    fs.writeFileSync("users.json", JSON.stringify(users, null, 2));

    res.redirect("/success.html");  // NEW BEAUTIFUL PAGE
});


// LOGIN USER
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username);

    if (!user) {
        return res.send("User not found. <a href='/login.html'>Try Again</a>");
    }

    const match = await bcrypt.compare(password, user.password);

    if (match) {
        req.session.user = username;  // Save username in session
        res.redirect("/dashboard.html");   // FIXED
    } else {
        res.send("Incorrect password. <a href='/login.html'>Try Again</a>");
    }
});

// PROTECT ALL DASHBOARD ACCESS
app.get("/dashboard.html", (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login.html");
    }
    next(); // allow access
});
// Return logged-in username to frontend
app.get("/api/user", (req, res) => {
    if (!req.session.user) {
        return res.json({ loggedIn: false });
    }
    res.json({
        loggedIn: true,
        username: req.session.user
    });
});

// Logout
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/index.html");
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log("Server running at http://localhost:" + PORT);
});
