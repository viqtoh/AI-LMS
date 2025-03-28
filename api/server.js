const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authenticateToken = require("./middleware/auth");
const pool = require("./db");
const { User } = require("./models");

require("dotenv").config();

const app = express();
app.use(cors());

const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

// Increase the payload size limit
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(express.json());

// Serve the media folder statically
app.use("/media", express.static(path.join(__dirname, "media")));

async function getUserByToken(token) {
  try {
    const user = await User.findOne({ where: { token } });

    if (!user) {
      throw new Error("User not found");
    }

    return {
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      createdAt: user.createdAt,
      isAdmin: user.isAdmin
    };
  } catch (err) {
    console.error(err);
    throw new Error("Server error");
  }
}

app.post("/api/register", async (req, res) => {
  const { email, password, first_name, last_name } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const newUser = await User.create({
      email,
      password: hashedPassword,
      first_name,
      last_name
    });

    res.json({ ok: true, message: "User registered successfully", user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (user) {
      // Compare hashed password
      const validPassword = await bcrypt.compare(password, user.password);

      if (validPassword) {
        // Generate JWT token

        if (user.isAdmin) {
          return res.json({ error: "Access denied. Login with a User Account." });
        }

        const token = jwt.sign(
          { userId: user.id, email: user.email, iat: Math.floor(Date.now() / 1000) },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        await User.update({ token }, { where: { id: user.id } });

        return res.json({ message: "Login successful", token });
      }
    }

    res.status(401).json({ error: "Invalid credentials" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/change/password", authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token missing" });
    }

    const chuser = await getUserByToken(token);

    if (!chuser) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = await User.findOne({ where: { email: chuser.email } });

    const { current_password, new_password, confirm_new_password } = req.body;

    if (new_password !== confirm_new_password) {
      return res.status(400).json({ error: "New password and confirm password do not match" });
    }
    console.log(current_password, user);
    const validPassword = await bcrypt.compare(current_password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(new_password, 10);
    await User.update({ token: null }, { where: { email: user.email } });
    await User.update({ password: hashedNewPassword }, { where: { email: user.email } });

    res.json({ message: "Password updated successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token missing" });
    }

    const chuser = await getUserByToken(token);

    if (!chuser) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = await User.findOne({ where: { email: chuser.email } });

    res.json({
      user: {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        image: user.image || "",
        createdAt: user.createdAt,
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        postal_code: user.postal_code || "",
        country: user.country || "",
        tax_id: user.tax_id || ""
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/user/details", authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token missing" });
    }

    const chuser = await getUserByToken(token);

    if (!chuser) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = await User.findOne({ where: { email: chuser.email } });
    console.log(user);

    res.json({
      first_name: user.first_name,
      last_name: user.last_name,
      image: user.image || ""
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/profile", authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token missing" });
    }

    const user = await getUserByToken(token);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { first_name, last_name, phone, address, city, postal_code, country, tax_id, image } =
      req.body;
    if (image && !image.startsWith("/media/")) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `${user.email}_profile_${Date.now()}.png`;
      const filePath = path.join(__dirname, "media", fileName);

      // Ensure the media directory exists
      const mediaDir = path.join(__dirname, "media");
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir);
      }

      // Save the image to the media folder
      fs.writeFileSync(filePath, buffer);

      // Update the user's image field with the file path
      await User.update({ image: `/media/${fileName}` }, { where: { email: user.email } });
    }
    await User.update(
      {
        first_name,
        last_name,
        phone,
        address,
        city,
        postal_code,
        country,
        tax_id,
        token: user.token
      },
      { where: { email: user.email } }
    );

    const updatedUser = await User.findOne({ where: { email: user.email } });

    res.json({
      message: "Profile updated successfully",
      user: {
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        phone: updatedUser.phone || "",
        address: updatedUser.address || "",
        city: updatedUser.city || "",
        postal_code: updatedUser.postal_code || "",
        country: updatedUser.country || "",
        tax_id: updatedUser.tax_id || "",
        createdAt: updatedUser.createdAt,
        image: updatedUser.image || ""
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.get("/dashboard", authenticateToken, (req, res) => {
  res.json({ message: `Welcome, ${req.user.email}!`, user: req.user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

{
  /* Admin API */
}

app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (user) {
      // Compare hashed password
      const validPassword = await bcrypt.compare(password, user.password);

      if (validPassword) {
        if (!user.isAdmin) {
          return res.json({ error: "Access denied. Admin privileges required." });
        }
        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email, iat: Math.floor(Date.now() / 1000) },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        await User.update({ token }, { where: { id: user.id } });
        return res.json({ message: "Login successful", token });
      }
    }

    res.status(401).json({ error: "Invalid credentials" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
