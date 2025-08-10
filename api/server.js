const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authenticateToken = require("./middleware/auth");
const { pgPool } = require("./db");
const { Sequelize } = require("sequelize");
const db = require("./models");
const {
  generateOTP,
  sendVerificationEmail,
  generateRandomToken,
  sendPasswordResetEmail
} = require("./utils/helpers");

const {
  User,
  LearningPath,
  Category,
  Course,
  Module,
  UserProgress,
  LearningPathCourse,
  UserModuleProgress,
  Assessment,
  Question,
  Option,
  AttemptQuestion,
  AssessmentAttempt,
  UserAnswer,
  LoginActivity,
  Feedback
} = db;

const { Op, fn, col } = require("sequelize");

const { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek } = require("date-fns");

require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: [
      "http://ailms.absoluteworlds.com",
      "https://ailms.absoluteworlds.com",
      "http://localhost:3000",
      "http://192.168.18.7:3000"
    ]
  })
);

const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

// Increase the payload size limit
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

app.use(express.json());

// Serve the media folder statically
app.use("/media", express.static(path.join(__dirname, "media")));

function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

async function getUserByToken(token) {
  try {
    const user = await User.findOne({ where: { token } });

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.id,
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

app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  const FRONTEND_HOST = process.env.FRONTEND_HOST;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Important: Send a generic success message even if email isn't found
      // to prevent user enumeration attacks.
      return res.json({
        message: "If an account with that email exists, a password reset link has been sent."
      });
    }

    // Generate reset token and set expiry (e.g., 1 hour)
    const resetToken = generateRandomToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await user.update({
      reset_token: resetToken,
      reset_token_expiry: resetTokenExpiry
    });

    // Send the password reset email with the link
    await sendPasswordResetEmail(user.email, resetToken, FRONTEND_HOST);

    res.json({
      message: "If an account with that email exists, a password reset link has been sent."
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// 2. Reset Password (Using Token from Link)
app.post("/api/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token and new password are required." });
  }

  try {
    const user = await User.findOne({
      where: {
        reset_token: token,
        reset_token_expiry: { [Op.gt]: new Date() } // Token is not expired
      }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired password reset token." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password and clear reset token fields
    await user.update({
      password: hashedPassword,
      reset_token: null,
      reset_token_expiry: null
    });

    res.json({ message: "Your password has been successfully reset." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

app.post("/api/register", async (req, res) => {
  const { email, password, first_name, last_name } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      // To prevent user enumeration, you could send a generic message
      // even if the user exists but is unverified.
      return res.status(400).json({ error: "Email is already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    const newUser = await User.create({
      email,
      password: hashedPassword,
      first_name,
      last_name,
      otp,
      otp_expiry,
      last_sent: new Date() // Record the time the OTP was sent
    });

    // Send the verification email
    await sendVerificationEmail(newUser.email, otp);

    res.json({
      ok: true,
      message: "Registration successful. Please check your email for a verification code."
      // Do NOT send the user object or a token yet
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during registration." });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (user) {
      const validPassword = await bcrypt.compare(password, user.password);

      if (validPassword) {
        // --- NEW VERIFICATION CHECK ---
        if (!user.emailVerified) {
          return res.status(401).json({
            error: "Email not verified.",
            verificationRequired: true // A flag for your frontend
          });
        }
        // --- END OF CHECK ---

        if (user.isAdmin) {
          return res.status(403).json({ error: "Access denied. Login with a User Account." });
        }
        if (!user.isActive) {
          return res.status(403).json({ error: "User Account Disabled" });
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email, iat: Math.floor(Date.now() / 1000) },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        const lastLogin = new Date();
        await User.update({ token, lastLogin }, { where: { id: user.id } });

        await LoginActivity.create({
          userId: user.id,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"]
        });

        return res.json({ message: "Login successful", token });
      }
    }

    res.status(401).json({ error: "Invalid credentials" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const BASE_COOLDOWN_MS = 60 * 1000; // 60 seconds
const RESET_THRESHOLD_MS = 12 * 60 * 60 * 1000; // 12 hours
const MAX_COOLDOWN_MS = 12 * 60 * 60 * 1000;

const formatCooldownTime = (totalSeconds) => {
  // Handle edge case of 0 or less
  if (totalSeconds <= 0) {
    return "0s";
  }

  // Calculate hours, minutes, and seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Build the string parts
  const parts = [];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  // Always show seconds if the duration is less than a minute,
  // or if there are leftover seconds with larger units.
  if (seconds > 0 || totalSeconds < 60) {
    parts.push(`${seconds}s`);
  }

  return parts.join(" ");
};

app.post("/api/send-verification", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    if (user.emailVerified) {
      return res.status(400).json({ error: "Email is already verified." });
    }

    const now = new Date();
    // Get the user's current cooldown, defaulting to the base cooldown.
    const currentCooldown = user.otp_cooldown_duration || BASE_COOLDOWN_MS;

    // --- Check if user is currently in a cooldown period ---
    if (user.last_sent) {
      const timeSinceLastSent = now - new Date(user.last_sent);

      if (timeSinceLastSent < currentCooldown) {
        const nextCooldown = Math.min(currentCooldown * 2, MAX_COOLDOWN_MS);

        const timeLeft = Math.ceil((currentCooldown - timeSinceLastSent) / 1000);
        return res.status(429).json({
          message: `Please wait ${formatCooldownTime(timeLeft)} before requesting a new code.`,
          timeLeft: timeLeft // Send the remaining time
        });
      }
    }

    // --- ALLOWED TO SEND ---
    // At this point, the user is allowed to receive a new OTP.
    // Now, we determine what their *next* cooldown period will be.

    let newCooldownForDb = currentCooldown;
    // Check if the cooldown period should be reset to the base value.
    if (user.last_sent && now - new Date(user.last_sent) > RESET_THRESHOLD_MS) {
      newCooldownForDb = BASE_COOLDOWN_MS;
    }

    // Generate and save new OTP
    const otp = generateOTP();
    const otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    // Send the new verification email
    await sendVerificationEmail(user.email, otp);

    await user.update({ otp_cooldown_duration: newCooldownForDb });

    await user.update({
      otp,
      otp_expiry,
      last_sent: now,
      otp_cooldown_duration: newCooldownForDb // Save the calculated next cooldown
    });

    // Respond with success, telling the frontend what the next cooldown is.
    res.json({
      ok: true,
      message: "A new verification code has been sent to your email.",
      timeLeft: newCooldownForDb / 1000 // Return next cooldown in seconds
    });
  } catch (err) {
    console.error("OTP Send Error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

app.post("/api/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check if OTP is correct and not expired
    if (user.otp !== otp || new Date() > new Date(user.otp_expiry)) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    // Mark user as verified and clear OTP fields
    await user.update({
      emailVerified: true,
      otp: null,
      otp_expiry: null,
      last_sent: null
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, iat: Math.floor(Date.now() / 1000) },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const lastLogin = new Date();
    await User.update({ token, lastLogin }, { where: { id: user.id } });

    await LoginActivity.create({
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    res.json({
      ok: true,
      message: "Email verified successfully. You are now logged in.",
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
});

app.get("/api/dashboard", authenticateToken, async (req, res) => {
  try {
    const chuser = await getUserByToken(req.headers["authorization"]?.split(" ")[1]);

    if (!chuser) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = await User.findOne({ where: { email: chuser.email } });

    if (!user) {
      return res.status(404).json({ error: "User record not found" });
    }

    const progresses = await UserProgress.findAll({ where: { userId: user.id } });

    // Completed Courses
    const completedCoursesArr = await Promise.all(
      progresses
        .filter((progress) => progress.progress === 100 && progress.courseId)
        .map(async (progress) => {
          const course = await Course.findOne({ where: { id: progress.courseId } });
          return course
            ? {
                ...course.toJSON(),
                type: "Course",
                started: formatDate(progress.createdAt),
                ended: formatDate(progress.updatedAt),
                progress: progress.progress,
                updatedAt: course.updatedAt
              }
            : null;
        })
    );

    // Completed Learning Paths
    const completedPathsArr = await Promise.all(
      progresses
        .filter((progress) => progress.progress === 100 && progress.learningPathId)
        .map(async (progress) => {
          const path = await LearningPath.findOne({ where: { id: progress.learningPathId } });
          return path
            ? {
                ...path.toJSON(),
                type: "LearningPath",
                started: formatDate(progress.createdAt),
                ended: formatDate(progress.updatedAt),
                progress: progress.progress,
                updatedAt: path.updatedAt
              }
            : null;
        })
    );

    const completedCoursesObj = [...completedCoursesArr, ...completedPathsArr]
      .filter(Boolean)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    // Incomplete Courses
    const inCompletedCoursesArr = (
      await Promise.all(
        progresses
          .filter((progress) => progress.progress !== 100 && progress.courseId)
          .map(async (progress) => {
            const course = await Course.findOne({
              where: { id: progress.courseId, show_outside: true }
            });
            return course ? { course, progress } : null;
          })
      )
    )
      .filter(Boolean)
      .map(({ course, progress }) => ({
        ...course.toJSON(),
        type: "Course",
        started: formatDate(progress.createdAt),
        progress: progress.progress,
        updatedAt: course.updatedAt
      }));

    // Incomplete Learning Paths
    const inCompletedPathsArr = (
      await Promise.all(
        progresses
          .filter((progress) => progress.progress !== 100 && progress.learningPathId)
          .map(async (progress) => {
            const path = await LearningPath.findOne({ where: { id: progress.learningPathId } });
            return path ? { path, progress } : null;
          })
      )
    )
      .filter(Boolean)
      .map(({ path, progress }) => ({
        ...path.toJSON(),
        type: "Learning Path",
        started: formatDate(progress.createdAt),
        progress: progress.progress,
        updatedAt: path.updatedAt
      }));

    const inCompletedCoursesObj = [...inCompletedCoursesArr, ...inCompletedPathsArr].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    return res.json({
      user: user,
      completedCourses: completedCoursesObj,
      inCompletedCourses: inCompletedCoursesObj
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

//region update user progress

const updateUserCourseProgress = async (userId, courseId, progress) => {
  try {
    const userProgress = await UserProgress.findOne({
      where: { userId: userId, courseId: courseId }
    });

    if (!userProgress) {
      await UserProgress.create({
        userId: userId,
        courseId: courseId,
        progress: Math.floor(progress)
      });
    } else {
      await UserProgress.update(
        { progress: Math.floor(progress) },
        { where: { userId: userId, courseId: courseId } }
      );
    }
    return "success";
  } catch (err) {
    return err;
  }
};

const updateUserPathProgress = async (userId, learningPathId, progress) => {
  try {
    const userProgress = await UserProgress.findOne({
      where: { userId: userId, learningPathId: learningPathId }
    });

    if (!userProgress) {
      await UserProgress.create({
        userId: userId,
        learningPathId: learningPathId,
        progress: Math.floor(progress)
      });
    } else {
      await UserProgress.update(
        { progress: Math.floor(progress) },
        { where: { userId: userId, learningPathId: learningPathId } }
      );
    }
    return "success";
  } catch (err) {
    return err;
  }
};

app.post("/api/set/active/module", authenticateToken, async (req, res) => {
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
    const { courseId, learningPathId, moduleId, end } = req.body;

    if (courseId) {
      const course = await Course.findOne({ where: { id: courseId } });
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course && learningPathId) {
        const pathCourse = await LearningPathCourse.findOne({
          where: { learningPathId: learningPathId, courseId: courseId }
        });
        if (!pathCourse) {
          const orderindex = pathCourse.orderIndex;
          const lastpathCourse = await LearningPathCourse.findOne({
            where: { learningPathId: learningPathId, orderIndex: orderindex - 1 }
          });
          const lastCourse = await Course.findOne({ where: { id: lastpathCourse.CourseId } });
          if (lastCourse) {
            const lastCourseP = await UserProgress.findOne({
              where: { userId: user.id, courseId: lastCourse.id }
            });
            if (lastCourseP) {
              await lastCourseP.update({
                progress: 100,
                updatedAt: new Date()
              });
            } else {
              await UserProgress.create({
                userId: user.id,
                courseId: lastCourse.id,
                progress: 100,
                updatedAt: new Date()
              });
            }
          }
        }
      }
      const module = await Module.findOne({ where: { id: moduleId } });
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      const allModules = await Module.findAll({ where: { courseId: courseId } });
      let progress;
      if (end) {
        progress = 100;
      } else {
        if (module.order === 1) {
          progress = 0;
        } else {
          const lastModule = allModules.find((m) => m.order === module.order - 1);
          const moduleP = await UserModuleProgress.findOne({
            where: { userId: user.id, moduleId: lastModule.id }
          });
          if (moduleP) {
            await moduleP.update({
              status: "completed",
              progress: 100,
              last_accessed_at: new Date()
            });
          } else {
            await UserModuleProgress.create({
              userId: user.id,
              moduleId: lastModule.id,
              status: "completed",
              progress: 100,
              last_accessed_at: new Date()
            });
          }
          progress = ((module.order - 1) / allModules.length) * 100;
        }
      }
      const updateProgress = await updateUserCourseProgress(user.id, courseId, progress);
      if (updateProgress !== "success") {
        return res.status(500).json({ error: "Failed to update user progress" });
      }
    }

    if (learningPathId) {
      const path = await LearningPath.findOne({
        where: { id: learningPathId },
        include: [
          {
            model: Course,

            as: "Courses"
          }
        ]
      });

      if (path) {
        const allCourses = await LearningPathCourse.findAll({
          where: { learningPathId: learningPathId },
          order: [["orderIndex", "ASC"]]
        });
        const totalCourses = allCourses.length;
        const currentCoursePosition = allCourses.findIndex((c) => c.CourseId === courseId) + 1;
        const progressPercentage = (currentCoursePosition / totalCourses) * 100;
        const updateProgress = await updateUserPathProgress(
          user.id,
          learningPathId,
          progressPercentage
        );
        if (updateProgress !== "success") {
          return res.status(500).json({ error: "Failed to update user progress" });
        }
      }
    }
    return res.status(200).json({ message: "User progress updated successfully" });
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

    if (new_password === "" || new_password === null) {
      return res.status(400).json({ error: "Please Enter a Valid Password" });
    }
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

    if (!user.isActive) {
      return res.json({ error: "Account Disabled" });
    }

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

app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
//region get categories

app.get("/api/category", authenticateToken, async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [
        { model: LearningPath, through: { attributes: [] }, as: "LearningPaths" },
        { model: Course, through: { attributes: [] }, as: "Courses" }
      ]
    });

    // Format response
    const formattedCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      learningPathCount: category.LearningPaths ? category.LearningPaths.length : 0,
      courseCount: category.Courses ? category.Courses.length : 0,
      text: `Used in ${
        category.LearningPaths ? category.LearningPaths.length : 0
      } Learning Paths and ${category.Courses ? category.Courses.length : 0} Courses`
    }));

    res.status(200).json(formattedCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//region get contents by user

app.get("/api/contents", authenticateToken, async (req, res) => {
  try {
    const { type, sort, start = 0, limit = 10, categories, search } = req.query; // Default: start at 0, limit 10

    let contents = [];
    if (categories) {
      const categoryList = categories.split(",").map((cat) => cat.trim());
      const categoryFilter = {
        include: [
          {
            model: Category,
            where: { name: { [Op.in]: categoryList } },
            through: { attributes: [] }
          }
        ]
      };

      if (!type || type === "both") {
        const learningPaths = await LearningPath.findAll(categoryFilter);
        const courses = await Course.findAll({
          ...categoryFilter,
          where: { show_outside: true }
        });

        contents = [
          ...learningPaths.map((lp) => ({ ...lp.toJSON(), type: "Learning Path" })),
          ...courses.map((course) => ({ ...course.toJSON(), type: "Course" }))
        ];
      } else if (type === "learningpath") {
        const learningPaths = await LearningPath.findAll(categoryFilter);
        contents = learningPaths.map((lp) => ({ ...lp.toJSON(), type: "Learning Path" }));
      } else if (type === "course") {
        const courses = await Course.findAll({
          ...categoryFilter,
          where: { show_outside: true }
        });
        contents = courses.map((course) => ({ ...course.toJSON(), type: "Course" }));
      }
    } else {
      if (!type || type === "both") {
        const learningPaths = await LearningPath.findAll();
        const courses = await Course.findAll({ where: { show_outside: true } });

        contents = [
          ...learningPaths.map((lp) => ({ ...lp.toJSON(), type: "Learning Path" })),
          ...courses.map((course) => ({ ...course.toJSON(), type: "Course" }))
        ];
      } else if (type === "learningpath") {
        const learningPaths = await LearningPath.findAll();
        contents = learningPaths.map((lp) => ({ ...lp.toJSON(), type: "Learning Path" }));
      } else if (type === "course") {
        const courses = await Course.findAll({ where: { show_outside: true } });
        contents = courses.map((course) => ({ ...course.toJSON(), type: "Course" }));
      }
    }

    if (search) {
      const searchLower = search.toLowerCase();
      contents = contents.filter(
        (content) =>
          content.title.toLowerCase().includes(searchLower) ||
          (content.description && content.description.toLowerCase().includes(searchLower))
      );
    }

    contents = contents.filter((content) => content.is_published === true);

    // Sorting
    if (sort === "desc") {
      contents.sort((a, b) => b.title.localeCompare(a.title));
    } else {
      contents.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Pagination
    const startIdx = parseInt(start, 10);
    const limitNum = parseInt(limit, 10);
    const paginatedContents = contents.slice(startIdx, startIdx + limitNum);

    res.status(200).json({
      total: contents.length,
      start: startIdx,
      limit: limitNum,
      contents: paginatedContents
    });
  } catch (error) {
    console.error("Error fetching contents:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//region get single contents

app.get("/api/learning-path-full/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token missing" });
    }

    const user = await getUserByToken(token);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = user.id;

    // Fetch learning path
    const learningPath = await LearningPath.findOne({
      where: { id },
      include: [
        {
          model: Category,
          through: { attributes: [] }, // Exclude join table attributes
          as: "Categories"
        },
        {
          model: Course,
          include: [
            {
              model: Category,
              through: { attributes: [] },
              as: "Categories"
            }
          ],
          as: "Courses",
          through: { attributes: ["orderIndex"] }
        }
      ]
    });

    if (!learningPath) {
      return res.status(404).json({ error: "Learning path not found." });
    }

    progress = await UserProgress.findOne({
      where: {
        userId,
        learningPathId: learningPath.id
      }
    });

    // Sort courses by orderIndex from the join table
    if (learningPath.Courses && learningPath.Courses.length > 0) {
      learningPath.Courses.sort((a, b) => {
        return a.LearningPathCourse.orderIndex - b.LearningPathCourse.orderIndex;
      });
    }

    // Format response
    const response = {
      id: learningPath.id,
      title: learningPath.title,
      image: learningPath.image,
      description: learningPath.description,
      categories: learningPath.Categories?.map((cat) => cat.name) || [],
      courses: [],
      progress: progress ? progress.progress : 0
    };

    // Fetch modules asynchronously for each course
    const coursesWithModules = await Promise.all(
      (learningPath.Courses || [])
        .filter((course) => course.is_published)
        .map(async (course) => {
          const modules = await Module.findAll({
            where: { courseId: course.id },
            order: [["order", "ASC"]]
          });

          const moduleIds = modules.map((m) => m.id);
          const progressRecords = await UserModuleProgress.findAll({
            where: {
              userId,
              moduleId: moduleIds
            }
          });

          const progressMap = {};
          progressRecords.forEach((record) => {
            progressMap[record.moduleId] = {
              status: record.status,
              progress: record.progress,
              last_accessed_at: record.last_accessed_at,
              last_second: record.last_second
            };
          });

          const enrichedModules = await Promise.all(
            modules.map(async (module) => {
              const progress = progressMap[module.id];
              let moduleData = {
                ...module.toJSON(),
                userProgress: progress || {
                  status: "not_started",
                  progress: 0,
                  last_accessed_at: null,
                  last_second: null
                }
              };

              if (module.content_type === "assessment") {
                // If the module is an assessment, add score to record
                const assessment = await Assessment.findOne({ where: { moduleId: module.id } });
                if (assessment) {
                  const attempt = await AssessmentAttempt.findOne({
                    where: { UserId: userId, AssessmentId: assessment.id }
                  });
                  if (attempt) {
                    const score = await calculateScore(attempt.id);
                    moduleData.score = score;
                    moduleData.userProgress = {
                      status: "completed",
                      progress: score >= assessment.passMark ? 100 : 0,
                      last_accessed_at: attempt.updatedAt,
                      last_second: null
                    };
                  } else {
                    moduleData.score = null;
                  }
                  moduleData.duration = assessment.duration;
                  moduleData.assessment = assessment;
                } else {
                  moduleData.score = null;
                }
              }

              return moduleData;
            })
          );

          // Determine course progress status
          const statuses = enrichedModules.map((m) => m.userProgress.status);
          let courseProgress = "not_started";
          if (statuses.every((s) => s === "completed")) courseProgress = "completed";
          else if (statuses.some((s) => s !== "not_started")) courseProgress = "in_progress";

          // Get course progress for this user/course
          let courseProgressRecord = await UserProgress.findOne({
            where: {
              userId,
              courseId: course.id
            }
          });

          return {
            id: course.id,
            title: course.title,
            description: course.description,
            categories: course.Categories?.map((cat) => cat.name) || [],
            modules: enrichedModules,
            courseProgress,
            progress: courseProgressRecord ? courseProgressRecord.progress : 0
          };
        })
    );

    response.courses = coursesWithModules;

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching learning path:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/api/course-full/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Token missing" });

    const user = await getUserByToken(token);
    if (!user) return res.status(404).json({ error: "User not found" });

    const userId = user.id;

    // Fetch course with categories
    const course = await Course.findOne({
      where: { id },
      include: [
        {
          model: Category,
          through: { attributes: [] },
          as: "Categories"
        }
      ]
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found." });
    }

    // Fetch modules
    const modules = await Module.findAll({ where: { courseId: id }, order: [["order", "ASC"]] });

    const moduleIds = modules.map((m) => m.id);

    const progressRecords = await UserModuleProgress.findAll({
      where: {
        userId,
        moduleId: moduleIds
      }
    });

    const progressMap = {};
    progressRecords.forEach((record) => {
      progressMap[record.moduleId] = {
        status: record.status,
        progress: record.progress,
        last_accessed_at: record.last_accessed_at,
        last_second: record.last_second
      };
    });

    const enrichedModules = await Promise.all(
      modules.map(async (mod) => {
        let userProgress = progressMap[mod.id] || {
          status: "not_started",
          progress: 0,
          last_accessed_at: null,
          last_second: null
        };

        // Add score if module is an assessment
        let score = null;
        let assessment;
        if (mod.content_type === "assessment") {
          assessment = await Assessment.findOne({ where: { moduleId: mod.id } });
          if (assessment) {
            const attempt = await AssessmentAttempt.findOne({
              where: { UserId: userId, AssessmentId: assessment.id }
            });

            if (attempt) {
              score = await calculateScore(attempt.id);
              userProgress = {
                status: "completed",
                progress: score >= assessment.passMark ? 100 : 0,
                last_accessed_at: attempt.updatedAt,
                last_second: null
              };
            }
          }
        }
        if (score) {
          return {
            ...mod.toJSON(),
            userProgress,
            score,
            assessment: assessment
          };
        }

        return {
          ...mod.toJSON(),
          userProgress,
          assessment: assessment
        };
      })
    );

    // Determine overall courseProgress
    const statuses = enrichedModules.map((m) => m.userProgress.status);
    let courseProgress = "not_started";
    if (statuses.every((s) => s === "completed")) courseProgress = "completed";
    else if (statuses.some((s) => s !== "not_started")) courseProgress = "in_progress";

    const progress = await UserProgress.findOne({ where: { userId, courseId: id } });

    const response = {
      id: course.id,
      title: course.title,
      image: course.image,
      description: course.description,
      categories: course.Categories?.map((cat) => cat.name) || [],
      modules: enrichedModules,
      courseProgress,
      progress: progress ? progress.progress : 0
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//region module progress

app.post("/api/module-progress/:moduleId", authenticateToken, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { status, progress, last_second } = req.body;

    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token missing" });

    const user = await getUserByToken(token);
    if (!user) return res.status(404).json({ error: "User not found" });

    const userId = user.id;
    const module = await Module.findByPk(moduleId);

    // Find or create progress record
    let [record, created] = await UserModuleProgress.findOrCreate({
      where: { userId, moduleId },
      defaults: {
        status: status || "in_progress",
        progress: progress ? Math.floor(progress) : 0,
        last_second: last_second ? Math.floor(last_second) : 0,
        last_accessed_at: new Date()
      }
    });

    if (!created) {
      // Update existing record
      record.status = status || record.status;
      record.progress = typeof progress === "number" ? Math.floor(progress) : record.progress;
      record.last_second = typeof last_second === "number" ? last_second : record.last_second;
      record.last_accessed_at = new Date();
      await record.save();
    }

    res.status(200).json({ message: "Progress updated", data: record });
  } catch (error) {
    console.error("Error updating module progress:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//region user test
//get assessment by module id
app.get("/api/assessment/module/:moduleId", authenticateToken, async (req, res) => {
  const { moduleId } = req.params;

  try {
    const module = await Module.findByPk(moduleId, {
      include: {
        model: Assessment,
        include: {
          model: Question,
          include: Option
        }
      }
    });

    if (!module) {
      return res.status(404).json({ message: "Module not found." });
    }

    const assessment = module.Assessment;

    if (!assessment) {
      return res.json({
        moduleName: module.title,
        assessment: null,
        questions: []
      });
    }

    const formattedQuestions = assessment.Questions.sort((a, b) => a.id - b.id) // Sort questions by id
      .map((q) => ({
        id: q.aid,
        question: q.text,
        answers: q.Options.sort((a, b) => a.id - b.id) // Sort options by id
          .map((opt) => ({
            id: opt.qid,
            text: opt.text
          }))
      }));

    res.json({
      moduleName: module.title,
      assessmentId: assessment.id,
      title: assessment.title,
      questions: formattedQuestions,
      duration: assessment.duration
    });
  } catch (error) {
    console.error("Error fetching module and assessment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// check test
app.get("/api/assessment-attempt/check/:assessmentId", authenticateToken, async (req, res) => {
  const { assessmentId } = req.params;

  try {
    if (!assessmentId) {
      return res.status(400).json({ message: "Assessment ID is required" });
    }

    const token = req.headers["authorization"]?.split(" ")[1];
    const user = await getUserByToken(token);
    if (!user) return res.status(404).json({ message: "User not found" });

    const attempt = await AssessmentAttempt.findOne({
      where: {
        AssessmentId: assessmentId,
        UserId: user.id
      },
      include: [{ model: Assessment }],
      order: [["createdAt", "DESC"]]
    });

    if (!attempt) {
      const assessment = await Assessment.findByPk(assessmentId);
      const duration = assessment ? assessment.duration : 0;
      return res.status(200).json({ exists: false, hasTimeLeft: false, duration: duration });
    }

    const startTime = new Date(attempt.startTime);
    const now = new Date();
    const elapsedSeconds = Math.floor((now - startTime) / 1000); // milliseconds to seconds
    const totalDurationSeconds = attempt.Assessment.duration * 60;

    const hasTimeLeft = elapsedSeconds < totalDurationSeconds;

    return res.status(200).json({
      exists: true,
      hasTimeLeft,
      timeUsed: elapsedSeconds,
      timeRemaining: Math.max(0, totalDurationSeconds - elapsedSeconds),
      assessmentAttemptId: attempt.id,
      duration: attempt.Assessment.duration,
      score: await calculateScore(attempt.id)
    });
  } catch (err) {
    console.error("Error checking assessment attempt:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//start test

app.post("/api/assessment-attempt", authenticateToken, async (req, res) => {
  const { assessmentId } = req.body;

  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token missing" });

    const user = await getUserByToken(token);
    if (!user) return res.status(404).json({ error: "User not found" });
    // Validate input
    if (!assessmentId) {
      return res.status(400).json({ message: "Assessment not found" });
    }

    // Get the assessment and number of questions
    const assessment = await Assessment.findByPk(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    const numberToSelect = assessment.numberOfQuestions;
    const userId = user.id;
    // Fetch random questions from the assessment
    // First, get question IDs that have correct options
    // Step 1: Get question IDs that have correct options
    const questionsWithCorrectOptions = await Question.findAll({
      where: { AssessmentId: assessmentId },
      include: [
        {
          model: Option,
          where: { isCorrect: true },
          required: true
        }
      ],
      attributes: ["id"] // Only get the ID to avoid grouping issues
      // Remove the group clause entirely
    });

    // Extract unique question IDs (in case there are duplicates due to multiple correct options)
    const questionIds = [...new Set(questionsWithCorrectOptions.map((q) => q.id))];

    // Step 2: Get random selection with all options
    const isMySQL = process.env.DB_DIALECT === "mysql";

    const allQuestions = await Question.findAll({
      where: {
        AssessmentId: assessmentId,
        id: { [Sequelize.Op.in]: questionIds }
      },
      include: [{ model: Option }],
      order: Sequelize.literal(isMySQL ? "RAND()" : "RANDOM()"),
      limit: numberToSelect
    });

    // Create the attempt
    const attempt = await AssessmentAttempt.create({
      UserId: userId,
      AssessmentId: assessmentId,
      startTime: new Date()
    });

    // Associate the selected questions to the attempt
    for (const question of allQuestions) {
      await AttemptQuestion.create({
        AttemptId: attempt.id,
        QuestionId: question.id
      });
    }

    // Return the attempt and questions
    const formattedQuestions = allQuestions.map((q) => ({
      id: q.id,
      question: q.text,
      answers: q.Options.sort((a, b) => a.id - b.id).map((opt) => ({
        id: opt.id,
        text: opt.text
      }))
    }));

    res.status(201).json({
      message: "Assessment attempt created",
      attemptId: attempt.id,
      questions: formattedQuestions,
      duration: assessment.duration
    });
  } catch (error) {
    console.error("Error creating assessment attempt:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/assessment-attempt/resume", authenticateToken, async (req, res) => {
  const { assessmentAttemptId } = req.body;

  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token missing" });

    const user = await getUserByToken(token);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!assessmentAttemptId) {
      return res.status(400).json({ message: "AssessmentAttempt ID is required" });
    }

    const assessmentAttempt = await AssessmentAttempt.findOne({
      where: {
        id: assessmentAttemptId,
        UserId: user.id
      }
    });

    if (!assessmentAttempt) {
      return res.status(404).json({ message: "Assessment attempt not found" });
    }

    // Step 1: Get AttemptQuestions in the order they were created
    const attemptQuestions = await AttemptQuestion.findAll({
      where: { AttemptId: assessmentAttemptId },
      order: [["createdAt", "ASC"]] // <-- This preserves original question order
    });

    const questionIds = attemptQuestions.map((aq) => aq.QuestionId);

    // Step 2: Fetch all related questions + their options
    const questions = await Question.findAll({
      where: { id: questionIds },
      include: [{ model: Option }]
    });

    // Step 3: Create a map for quick lookup
    const questionMap = {};
    questions.forEach((q) => {
      questionMap[q.id] = q;
    });

    const answers = await UserAnswer.findAll({
      where: { AttemptId: assessmentAttemptId }
    });

    // Step 4: Format the questions preserving order
    const formattedQuestions = attemptQuestions
      .map((aq) => {
        const q = questionMap[questionIds.find((indexElement) => indexElement === aq.QuestionId)];
        if (q) {
          const isMulti = q.Options.filter((opt) => opt.isCorrect).length > 1;
          return {
            id: q.id,
            question: q.text,
            isMulti: isMulti,
            answers: q.Options.sort((a, b) => a.id - b.id).map((opt) => ({
              id: opt.id,
              text: opt.text,
              selected: answers.some((answer) => answer.OptionId === opt.id)
            }))
          };
        }
        return null; // Return null for undefined questions
      })
      .filter((q) => q !== null); // Filter out null values

    const assessment = await Assessment.findByPk(assessmentAttempt.AssessmentId);

    res.status(200).json({
      message: "Assessment resumed",
      attemptId: assessmentAttempt.id,
      questions: formattedQuestions,
      duration: assessment.duration
    });
  } catch (error) {
    console.error("Error resuming assessment attempt:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//end test

async function calculateScore(assessmentAttemptId) {
  // Get all attempt questions for this attempt
  const attemptQuestions = await AttemptQuestion.findAll({
    where: { AttemptId: assessmentAttemptId },
    include: [
      {
        model: Question,
        include: [Option]
      },
      {
        model: UserAnswer,
        include: [Option]
      }
    ]
  });

  let correctCount = 0;

  for (const aq of attemptQuestions) {
    const question = aq.Question;
    const allCorrectOptions = question.Options.filter((opt) => opt.isCorrect)
      .map((opt) => opt.id)
      .sort();
    const userSelectedOptions = aq.UserAnswers.map((ua) => ua.Option.id).sort();

    // Check if user selected all correct options and only those
    const isCorrect = JSON.stringify(userSelectedOptions) === JSON.stringify(allCorrectOptions);

    if (isCorrect) {
      correctCount++;
    }
  }

  const totalQuestions = attemptQuestions.length;
  const scorePercent = totalQuestions ? ((correctCount / totalQuestions) * 100).toFixed(2) : "0.00";

  // Collect wrongly answered questions
  const Recommendations = [];
  for (const aq of attemptQuestions) {
    const question = aq.Question;
    const allCorrectOptions = question.Options.filter((opt) => opt.isCorrect)
      .map((opt) => opt.id)
      .sort();
    const userSelectedOptions = aq.UserAnswers.map((ua) => ua.Option.id).sort();

    const isCorrect = JSON.stringify(userSelectedOptions) === JSON.stringify(allCorrectOptions);

    if (!isCorrect && question.module) {
      module = await Module.findOne({ where: { id: question.module } });
      // Only add the module if it's not already in Recommendations
      if (module && !Recommendations.some((rec) => rec.id === module.id)) {
        Recommendations.push(module);
      }
    }
  }

  return {
    totalQuestions,
    correctAnswers: correctCount,
    scorePercent,
    Recommendations
  };
}

app.post("/api/assessment-attempt/end-assessment", authenticateToken, async (req, res) => {
  const { assessmentAttemptId } = req.body;

  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token missing" });

    const user = await getUserByToken(token);
    if (!user) return res.status(404).json({ error: "User not found" });

    const assessmentAttempt = await AssessmentAttempt.findOne({
      where: {
        id: assessmentAttemptId,
        UserId: user.id
      }
    });

    if (!assessmentAttempt) {
      return res.status(404).json({ message: "Assessment attempt not found" });
    }

    const assessment = await Assessment.findByPk(assessmentAttempt.AssessmentId);

    // Calculate the end time by subtracting the duration from now
    const durationMinutes = assessment.duration || 0;
    const endTime = new Date();
    const fakeStartTime = new Date(endTime.getTime() - durationMinutes * 60 * 1000);

    // Update the attempt: set status to completed and set startTime so that it appears ended
    await assessmentAttempt.update({
      status: "completed",
      startTime: fakeStartTime
    });

    res.status(201).json({
      message: "Assessment ended",
      score: await calculateScore(assessmentAttempt.id)
    });
  } catch (error) {
    console.error("Error ending assessment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/assessment-attempt/setAnswer", authenticateToken, async (req, res) => {
  const { assessmentAttemptId, answerId, remove } = req.body;

  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token missing" });

    const user = await getUserByToken(token);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!assessmentAttemptId) {
      return res.status(400).json({ message: "AssessmentAttempt ID is required" });
    }

    const option = await Option.findOne({
      where: { id: answerId }
    });

    if (!option) {
      return res.status(404).json({ message: "Option not found" });
    }

    const question = await Question.findOne({
      where: { id: option.QuestionId },
      include: [{ model: Option }]
    });

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const attemptQuestion = await AttemptQuestion.findOne({
      where: { AttemptId: assessmentAttemptId, QuestionId: question.id }
    });

    let userAnswer = await UserAnswer.findOne({
      where: {
        AttemptId: assessmentAttemptId,
        OptionId: answerId
      }
    });

    const isMultiple = question.Options.filter((opt) => opt.isCorrect).length > 1;

    if (isMultiple) {
      if (userAnswer) {
        await userAnswer.destroy();
      } else {
        if (!userAnswer) {
          userAnswer = await UserAnswer.create({
            OptionId: answerId,
            AttemptQuestionId: attemptQuestion.id,
            AttemptId: assessmentAttemptId
          });
        }
      }
    } else {
      if (!userAnswer) {
        userAnswer = await UserAnswer.create({
          OptionId: answerId,
          AttemptQuestionId: attemptQuestion.id,
          AttemptId: assessmentAttemptId
        });

        const otherAnswers = await UserAnswer.findAll({
          where: {
            AttemptId: assessmentAttemptId,
            AttemptQuestionId: attemptQuestion.id
          }
        });

        otherAnswers.forEach((answer) => {
          if (answer.OptionId !== userAnswer.OptionId) {
            answer.destroy();
          }
        });
      }
    }

    const assessmentAttempt = await AssessmentAttempt.findOne({
      where: {
        id: assessmentAttemptId,
        UserId: user.id
      }
    });

    if (!assessmentAttempt) {
      return res.status(404).json({ message: "Assessment attempt not found" });
    }

    const attemptQuestions = await AttemptQuestion.findAll({
      where: { AttemptId: assessmentAttemptId },
      order: [["createdAt", "ASC"]]
    });

    const questionIds = attemptQuestions.map((aq) => aq.QuestionId);

    const questions = await Question.findAll({
      where: { id: questionIds },
      include: [{ model: Option }]
    });

    const questionMap = {};
    questions.forEach((q) => {
      questionMap[q.id] = q;
    });

    const answers = await UserAnswer.findAll({
      where: { AttemptId: assessmentAttemptId }
    });

    const formattedQuestions = attemptQuestions
      .map((aq) => {
        const q = questionMap[questionIds.find((indexElement) => indexElement === aq.QuestionId)];
        if (q) {
          const isMulti = q.Options.filter((opt) => opt.isCorrect).length > 1;
          return {
            id: q.id,
            question: q.text,
            isMulti: isMulti,
            answers: q.Options.sort((a, b) => a.id - b.id).map((opt) => ({
              id: opt.id,
              text: opt.text,
              selected: answers.some((answer) => answer.OptionId === opt.id)
            }))
          };
        }
        return null;
      })
      .filter((q) => q !== null);

    res.status(200).json({
      message: "Answer set successfully",
      questions: formattedQuestions
    });
  } catch (error) {
    console.error("Error setting answer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//get acheivement route

app.get("/api/achievements", authenticateToken, async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token missing" });

    const user = await getUserByToken(token);
    if (!user) return res.status(404).json({ error: "User not found" });
    const userObj = await User.findByPk(user.id, {
      attributes: ["id", "first_name", "last_name", "email", "image"]
    });

    // Helper function to check if all assessments within a given course are passed
    // This function expects the `course` object to already have `Modules` and `Assessments` included.
    const checkCourseAssessments = async (course, userId) => {
      // Filter for modules that are assessments and have an associated Assessment object
      const assessmentModules = course.Modules.filter(
        (m) => m.content_type === "assessment" && m.Assessment
      );

      // If there are no assessments in this course, it's considered "passed" by assessment criteria
      if (assessmentModules.length === 0) {
        return true;
      }

      for (const module of assessmentModules) {
        const assessment = module.Assessment;

        const attempts = await AssessmentAttempt.findAll({
          where: { UserId: userId, AssessmentId: assessment.id },
          order: [["createdAt", "DESC"]] // Optional: order by newest first if you want to prioritize latest
        });

        // If no attempts are found, the user has not completed this required assessment at all
        if (attempts.length === 0) {
          return false;
        }

        let passedThisAssessment = false; // Flag to track if *any* attempt for this assessment passed

        for (const attempt of attempts) {
          // Calculate the score for each attempt
          const scoreResult = await calculateScore(attempt.id);
          const userScore = parseFloat(scoreResult.scorePercent);
          const passMark = parseFloat(assessment.passMark);
          // Check if this specific attempt's score meets or exceeds the pass mark
          if (!isNaN(userScore) && !isNaN(passMark) && userScore >= passMark) {
            passedThisAssessment = true; // Found at least one successful attempt
            break; // No need to check other attempts for this assessment if one passed
          }
        }

        // If after checking all attempts for this assessment, none passed, then the course is not achieved
        if (!passedThisAssessment) {
          return false;
        }
      }
      return true; // All assessments in this course passed
    };

    // 1. Get all finished courses that are `show_outside: true`,
    //    including their modules and assessments, and the UserProgress update date.
    const finishedCoursesProgress = await UserProgress.findAll({
      where: { userId: user.id, progress: 100, courseId: { [Op.ne]: null } },
      include: [
        {
          model: Course,
          where: { show_outside: true }, // Filter courses here
          include: [
            {
              model: Module,
              include: [
                {
                  model: Assessment // Include Assessment if module is an assessment
                }
              ]
            }
          ]
        }
      ]
    });

    // Filter courses based on assessment pass marks
    const qualifiedCourses = [];
    for (const up of finishedCoursesProgress) {
      const course = up.Course;
      // Ensure the course object exists and contains modules/assessments if needed.
      // `up.Course` will be null if the `where` condition `show_outside: true` was not met for that course.
      if (course && (await checkCourseAssessments(course, user.id))) {
        qualifiedCourses.push({
          course: course.toJSON(), // Convert Sequelize instance to plain JSON object
          progressUpdatedAt: up.updatedAt // Capture the `attained_on` date
        });
      }
    }
    const filteredFinishedCourses = qualifiedCourses;

    // 2. Get all finished learning paths, including their courses, modules, and assessments,
    //    and the UserProgress update date.
    const finishedLearningPathsProgress = await UserProgress.findAll({
      where: { userId: user.id, progress: 100, learningPathId: { [Op.ne]: null } },
      include: [
        {
          model: LearningPath,
          include: [
            {
              model: Course,
              include: [
                {
                  model: Module,
                  include: [
                    {
                      model: Assessment
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    // Filter learning paths based on assessment pass marks within their contained courses
    const qualifiedLearningPaths = [];
    for (const up of finishedLearningPathsProgress) {
      const learningPath = up.LearningPath;
      if (!learningPath) continue; // Skip if learning path itself is null

      let allLPAssessmentsPassed = true;
      // Check if the learning path has courses and iterate through them
      if (learningPath.Courses && learningPath.Courses.length > 0) {
        for (const course of learningPath.Courses) {
          // If any course within the learning path fails its assessment check,
          // the entire learning path is not considered an achievement.
          if (!(await checkCourseAssessments(course, user.id))) {
            allLPAssessmentsPassed = false;
            break;
          }
        }
      }

      if (allLPAssessmentsPassed) {
        qualifiedLearningPaths.push({
          learningPath: learningPath.toJSON(), // Convert Sequelize instance to plain JSON object
          progressUpdatedAt: up.updatedAt // Capture the `attained_on` date
        });
      }
    }
    const filteredFinishedLearningPaths = qualifiedLearningPaths;

    // Construct the final achievements array using the filtered lists
    const achievements = [
      ...filteredFinishedCourses.map((item) => ({
        ...item.course,
        type: "Course",
        attained_on: item.progressUpdatedAt
      })),
      ...filteredFinishedLearningPaths.map((item) => ({
        ...item.learningPath,
        type: "LearningPath",
        attained_on: item.progressUpdatedAt
      }))
    ];

    // Sort achievements by attained_on date in descending order
    const achievementsResolved = achievements
      .filter((a) => a.attained_on) // Ensure we only include items with a valid attainment date
      .sort((a, b) => new Date(b.attained_on) - new Date(a.attained_on));

    res.json({
      finishedCourses: filteredFinishedCourses.length,
      finishedLearningPaths: filteredFinishedLearningPaths.length,
      user: userObj.toJSON(),
      achievements: achievementsResolved
    });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//region Admin Apis

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

        if (!user.isActive) {
          return res.json({ error: "Admin Account Disabled" });
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email, iat: Math.floor(Date.now() / 1000) },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        const lastLogin = new Date();
        await User.update({ token, lastLogin }, { where: { id: user.id } });
        return res.json({ message: "Login successful", token });
      }
    }

    res.status(401).json({ error: "Invalid credentials" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/dashboard", authenticateToken, async (req, res) => {
  const now = new Date();

  try {
    const totalUsers = await User.count();
    const totalCourses =
      (await Course.count({ where: { show_outside: true } })) + (await LearningPath.count());
    const totalStudents = await User.count({ where: { isAdmin: false } });
    const totalStaffs = await User.count({ where: { isAdmin: true } });
    // Summary stats
    const [today, yesterday, thisWeek] = await Promise.all([
      LoginActivity.count({
        where: {
          createdAt: {
            [Op.between]: [startOfDay(now), endOfDay(now)]
          }
        }
      }),
      LoginActivity.count({
        where: {
          createdAt: {
            [Op.between]: [startOfDay(subDays(now, 1)), endOfDay(subDays(now, 1))]
          }
        }
      }),
      LoginActivity.count({
        where: {
          createdAt: {
            [Op.between]: [startOfWeek(now), endOfWeek(now)]
          }
        }
      })
    ]);

    // Top 5 active users by login count
    const activeUsers = await LoginActivity.findAll({
      attributes: ["userId", [fn("COUNT", col("userId")), "loginCount"]],
      include: {
        model: User,
        attributes: ["id", "first_name", "last_name"]
      },
      group: ["userId", "User.id"],
      order: [[fn("COUNT", col("userId")), "DESC"]],
      limit: 5
    });

    const topUsers = activeUsers.map((entry) => ({
      name: entry.User.first_name + " " + entry.User.last_name,
      logins: entry.dataValues.loginCount
    }));

    const progresses = await UserProgress.count();
    const completedProgresses = await UserProgress.count({ where: { progress: 100 } });

    const completedProgressesObj = await UserProgress.findAll({ where: { progress: 100 } });
    const completedUsers = completedProgressesObj.map((entry) => entry.UserId);
    const completedUsersCount = new Set(completedUsers).size;

    // Top 3 most completed courses
    const topCompletedCourses = await UserProgress.findAll({
      attributes: ["courseId", [fn("COUNT", col("courseId")), "completionCount"]],
      where: { progress: 100, courseId: { [Op.ne]: null } },
      group: ["UserProgress.courseId", "Course.id", "Course.title"],
      order: [[fn("COUNT", col("UserProgress.courseId")), "DESC"]],
      limit: 3,
      include: {
        model: Course,
        attributes: ["id", "title"]
      }
    });

    const topCompletedPaths = await UserProgress.findAll({
      attributes: ["learningPathId", [fn("COUNT", col("learningPathId")), "completionCount"]],
      where: { progress: 100, learningPathId: { [Op.ne]: null } },
      group: ["UserProgress.learningPathId", "LearningPath.id", "LearningPath.title"],
      order: [[fn("COUNT", col("UserProgress.learningPathId")), "DESC"]],
      limit: 3,
      include: {
        model: LearningPath,
        attributes: ["id", "title"]
      }
    });

    // Combine top completed courses and learning paths, sort by completions, and limit to 3
    const combinedTop = [
      ...topCompletedCourses.map((entry) => ({
        id: entry.Course.id,
        title: entry.Course.title,
        completions: entry.dataValues.completionCount,
        type: "Course"
      })),
      ...topCompletedPaths.map((entry) => ({
        id: entry.LearningPath.id,
        title: entry.LearningPath.title,
        completions: entry.dataValues.completionCount,
        type: "LearningPath"
      }))
    ]
      .sort((a, b) => b.completions - a.completions)
      .slice(0, 3);

    const topCourses = combinedTop;

    res.json({
      totalUsers: totalUsers,
      totalCourses: totalCourses,
      totalStudents: totalStudents,
      totalStaffs: totalStaffs,
      totalProgresses: progresses,
      completedProgresses: completedProgresses,
      completedUsers: completedUsersCount,
      topCompletedCourses: topCourses,
      loginActivity: {
        today,
        yesterday,
        thisWeek
      },
      activeUsers: topUsers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

//region delete contents

const deleteModule = async (id) => {
  const module = await Module.findOne({ where: { id: id } });
  await module.destroy();
};

const deleteCourse = async (id) => {
  const course = await Course.findOne({ where: { id: id } });
  const modules = Module.findAll({ where: { courseId: id } });
  for (let i = 0; i < modules.length; i++) {
    const module = modules[i];
    await deleteModule(module.id);
  }
  await course.destroy();
};

app.delete("/api/admin/learning-path/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const learningPath = await LearningPath.findByPk(id);

    if (!learningPath) {
      return res.status(404).json({ error: "Learning path not found" });
    }

    // Find all courses associated with this learning path
    const courses = await learningPath.getCourses();

    // For each course, check if show_outside is false and not associated with any other learning path
    for (const course of courses) {
      if (!course.show_outside) {
        // Count how many learning paths this course is associated with
        const learningPathsForCourse = await course.getLearningPaths();
        if (learningPathsForCourse.length === 1) {
          // Only associated with this learning path, safe to delete
          await deleteCourse(course.id);
        }
      }
    }

    await learningPath.destroy();
    return res.status(200).json({ ok: true, message: "success" });
  } catch (error) {
    console.error("Error deleting learning path:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/admin/module/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await deleteModule(id);
    return res.status(200).json({ ok: true, message: "success" });
  } catch (error) {
    console.error("Error deleting module:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/admin/course/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteCourse(id);
    return res.status(200).json({ ok: true, message: "success" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//region create contents
app.post("/api/admin/learningpath", authenticateToken, async (req, res) => {
  try {
    const { title, description, image, difficulty, estimated_time, is_published, categoryIds } =
      req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: "Title is required." });
    }

    let categories = [];
    let categoryIDs = Array.isArray(categoryIds) ? categoryIds : JSON.parse(categoryIds);

    if (categoryIds.length > 0) {
      categories = await Category.findAll({ where: { id: categoryIDs } });

      if (categories.length !== categoryIDs.length) {
        return res.status(404).json({ error: "One or more categories not found." });
      }
    }

    // Create Learning Path
    const learningPath = await LearningPath.create({
      title,
      description,
      difficulty,
      estimated_time,
      is_published
    });

    if (image && !image.startsWith("/media/")) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `${title}_image_${Date.now()}.png`;
      const filePath = path.join(__dirname, "media", fileName);

      // Ensure the media directory exists
      const mediaDir = path.join(__dirname, "media");
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir);
      }

      // Save the image to the media folder
      fs.writeFileSync(filePath, buffer);

      await learningPath.update(
        { image: `/media/${fileName}` },
        { where: { id: learningPath.id } }
      );
    }

    // If categoryIds exist and are not empty, associate them
    if (categories.length > 0) {
      await learningPath.addCategories(categories);
    }

    res.status(201).json({ learningPath });
  } catch (error) {
    console.error("Error creating learning path:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/admin/course", authenticateToken, async (req, res) => {
  try {
    const { title, description, image, show_outside, is_published, categoryIds } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: "Title is required." });
    }

    let categories = [];

    let categoryIDs = Array.isArray(categoryIds) ? categoryIds : JSON.parse(categoryIds);

    if (categoryIds.length > 0) {
      categories = await Category.findAll({ where: { id: categoryIDs } });

      if (categories.length !== categoryIDs.length) {
        return res.status(404).json({ error: "One or more categories not found." });
      }
    }

    // Create Learning Path
    const course = await Course.create({
      title,
      description,
      show_outside,
      is_published
    });

    if (image && !image.startsWith("/media/")) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `${title}_image_${Date.now()}.png`;
      const filePath = path.join(__dirname, "media", fileName);

      // Ensure the media directory exists
      const mediaDir = path.join(__dirname, "media");
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir);
      }

      // Save the image to the media folder
      fs.writeFileSync(filePath, buffer);

      await course.update({ image: `/media/${fileName}` }, { where: { id: course.id } });
    }

    // If categoryIds exist and are not empty, associate them
    if (categories.length > 0) {
      await course.addCategories(categories);
    }

    res.status(201).json({ course });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//create course in learning path
app.post("/api/admin/learningpath/course/create", authenticateToken, async (req, res) => {
  try {
    const { title, description, image, show_outside, is_published, categoryIds, learningPathId } =
      req.body;

    // Validate required fields
    if (!title || !learningPathId) {
      return res.status(400).json({ error: "Title and Learning Path ID are required." });
    }

    // Ensure Learning Path exists
    const learningPath = await LearningPath.findByPk(learningPathId);
    if (!learningPath) {
      return res.status(404).json({ error: "Learning Path not found." });
    }

    let categories = [];
    let categoryIDs = Array.isArray(categoryIds) ? categoryIds : JSON.parse(categoryIds);

    if (categoryIDs.length > 0) {
      categories = await Category.findAll({ where: { id: categoryIDs } });

      if (categories.length !== categoryIDs.length) {
        return res.status(404).json({ error: "One or more categories not found." });
      }
    }

    // Create Course
    const course = await Course.create({
      title,
      description,
      show_outside,
      is_published
    });

    // Process Image Upload (if provided)
    if (image && !image.startsWith("/media/")) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `${title}_image_${Date.now()}.png`;
      const filePath = path.join(__dirname, "media", fileName);

      // Ensure media directory exists
      const mediaDir = path.join(__dirname, "media");
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir);
      }

      fs.writeFileSync(filePath, buffer);

      await course.update({ image: `/media/${fileName}` });
    }

    // Associate Categories (if provided)
    if (categories.length > 0) {
      await course.addCategories(categories);
    }

    // Get the last order index for courses in the Learning Path
    const lastCourse = await LearningPathCourse.findOne({
      where: { learningPathId },
      order: [["orderIndex", "DESC"]]
    });

    const newOrderIndex = lastCourse ? lastCourse.orderIndex + 1 : 1;

    // Add Course to Learning Path with new orderIndex
    await learningPath.addCourse(course, { through: { orderIndex: newOrderIndex } });

    res.status(201).json({
      message: "Course created and added to learning path successfully.",
      course,
      orderIndex: newOrderIndex
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//add a course to learning path
app.post("/api/admin/learningpath/course/add", authenticateToken, async (req, res) => {
  try {
    const { learningPathId, courseId, orderIndex } = req.body;
    // Validate inputs
    if (!learningPathId || !courseId) {
      return res.status(400).json({ error: "Learning path ID and course ID are required." });
    }

    // Find learning path and course
    const learningPath = await LearningPath.findByPk(learningPathId);
    const course = await Course.findByPk(courseId);

    if (!learningPath || !course) {
      return res.status(404).json({ error: "Learning path or course not found." });
    }

    // Get the last order index
    const lastCourse = await LearningPathCourse.findOne({
      where: { learningPathId },
      order: [["orderIndex", "DESC"]]
    });

    const newOrderIndex = lastCourse ? lastCourse.orderIndex + 1 : 1;

    // Add course to learning path with order
    await learningPath.addCourse(course, { through: { orderIndex: orderIndex || newOrderIndex } });

    res.status(200).json({ message: "Course added to learning path successfully." });
  } catch (error) {
    console.error("Error adding course to learning path:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//create module in course
app.post("/api/admin/course/:courseId/module", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, content_type, content_url, duration, file, is_published } =
      req.body;

    const mimeToExt = {
      "application/pdf": "pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
      "application/msword": "doc",
      "application/vnd.ms-powerpoint": "ppt",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
      "video/mp4": "mp4",
      "video/quicktime": "mov",
      "image/png": "png",
      "image/jpeg": "jpg"
    };

    // Validate required fields
    if (!title || !content_type) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (
      (content_type === "video" && !content_url && !file) ||
      (content_type === "video" && !duration)
    ) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if ((content_type === "ppt" || content_type === "docx") && !file) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Ensure the course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found." });
    }
    let fullfile = "";
    // Process file Upload (if provided)
    if (file && !file.startsWith("/media/")) {
      const matches = file.match(/^data:(.+);base64,/);
      const mimeType = matches ? matches[1] : null;
      const extension = mimeToExt[mimeType] || "bin";

      const base64Data = file.replace(/^data:.+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const safeTitle = title.replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
      const fileName = `${safeTitle}_file_${Date.now()}.${extension}`;
      const mediaDir = path.join(__dirname, "media");
      const filePath = path.join(mediaDir, fileName);

      // Create media folder if it doesn't exist
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }

      fs.writeFileSync(filePath, buffer);

      fullfile = `/media/${fileName}`;
    }

    // Get the last module for the course with the highest order field
    const lastModule = await Module.findOne({
      where: { courseId },
      order: [["order", "DESC"]]
    });

    const order = lastModule ? lastModule.order + 1 : 1;

    // Create the module
    const module = await Module.create({
      title,
      description,
      content_type,
      content_url,
      duration,
      file: fullfile,
      is_published,
      courseId,
      order
    });

    res.status(201).json({ message: "Module created successfully.", module });
  } catch (error) {
    console.error("Error creating module:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//update module
app.put("/api/admin/course/:courseId/module/:moduleId", authenticateToken, async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const { title, description, content_type, content_url, duration, file, is_published } =
      req.body;

    const mimeToExt = {
      "application/pdf": "pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
      "application/msword": "doc",
      "application/vnd.ms-powerpoint": "ppt",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
      "video/mp4": "mp4",
      "video/quicktime": "mov",
      "image/png": "png",
      "image/jpeg": "jpg"
    };

    // Check course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found." });
    }

    // Check module exists
    const module = await Module.findOne({
      where: { id: moduleId, courseId }
    });

    if (!module) {
      return res.status(404).json({ error: "Module not found." });
    }

    if (module.content_type !== content_type) {
      if (content_type !== "video" || !content_url) {
        if (!file || file.startsWith("/media/")) {
          return res.status(400).json({ error: "Content missing" });
        }
      }
    }
    let fullfile = module.file;

    // Process file if new one is provided
    if (file && !file.startsWith("/media/")) {
      const matches = file.match(/^data:(.+);base64,/);
      const mimeType = matches ? matches[1] : null;
      const extension = mimeToExt[mimeType] || "bin";

      const base64Data = file.replace(/^data:.+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const safeTitle = title.replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
      const fileName = `${safeTitle}_file_${Date.now()}.${extension}`;
      const mediaDir = path.join(__dirname, "media");
      const filePath = path.join(mediaDir, fileName);

      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }

      fs.writeFileSync(filePath, buffer);
      fullfile = `/media/${fileName}`;
    }

    // Update module
    await module.update({
      title,
      description,
      content_type,
      content_url,
      duration,
      file: fullfile,
      is_published
    });

    res.status(200).json({ message: "Module updated successfully.", module });
  } catch (error) {
    console.error("Error updating module:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//region update content

//update learning path
app.put("/api/admin/learningpath/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image, difficulty, estimated_time, is_published, categoryIds } =
      req.body;

    // Find the existing Learning Path
    const learningPath = await LearningPath.findByPk(id);
    if (!learningPath) {
      return res.status(404).json({ error: "Learning Path not found." });
    }

    // Update Learning Path details
    await learningPath.update({
      title,
      description,
      difficulty,
      estimated_time,
      is_published
    });

    if (image && !image.startsWith("/media/")) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `${title}_image_${Date.now()}.png`;
      const filePath = path.join(__dirname, "media", fileName);

      // Ensure the media directory exists
      const mediaDir = path.join(__dirname, "media");
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir);
      }

      // Save the image to the media folder
      fs.writeFileSync(filePath, buffer);

      await learningPath.update(
        { image: `/media/${fileName}` },
        { where: { id: learningPath.id } }
      );
    }
    let categories = [];

    let categoryIDs = Array.isArray(categoryIds) ? categoryIds : JSON.parse(categoryIds);

    if (categoryIds.length > 0) {
      categories = await Category.findAll({ where: { id: categoryIDs } });

      if (categories.length !== categoryIDs.length) {
        return res.status(404).json({ error: "One or more categories not found." });
      }
    }

    await learningPath.setCategories(categories);

    res.status(200).json({ learningPath });
  } catch (error) {
    console.error("Error updating learning path:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/admin/course/:id", authenticateToken, async (req, res) => {
  try {
    const { title, description, image, show_outside, is_published, categoryIds } = req.body;
    const { id } = req.params;

    // Find the existing Learning Path
    const course = await Course.findByPk(id);
    if (!course) {
      return res.status(404).json({ error: "Course not found." });
    }

    let categories = [];
    let categoryIDs = Array.isArray(categoryIds) ? categoryIds : JSON.parse(categoryIds);

    if (categoryIDs.length > 0) {
      categories = await Category.findAll({ where: { id: categoryIDs } });

      if (categories.length !== categoryIDs.length) {
        return res.status(404).json({ error: "One or more categories not found." });
      }
    }

    // update Course
    await course.update({
      title,
      description,
      show_outside,
      is_published
    });

    // Process Image Upload (if provided)
    if (image && !image.startsWith("/media/")) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `${title}_image_${Date.now()}.png`;
      const filePath = path.join(__dirname, "media", fileName);

      // Ensure media directory exists
      const mediaDir = path.join(__dirname, "media");
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir);
      }

      fs.writeFileSync(filePath, buffer);

      await course.update({ image: `/media/${fileName}` });
    }

    // Associate Categories (if provided)
    if (categories.length > 0) {
      await course.setCategories(categories);
    }

    res.status(201).json({
      message: "Course updated successfully.",
      course
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/admin/course/:courseId/move-up/:moduleId", authenticateToken, async (req, res) => {
  const { moduleId, courseId } = req.params;

  try {
    // Find the current course entry
    const currentEntry = await Module.findOne({
      where: { id: moduleId }
    });

    if (!currentEntry) {
      return res.status(404).json({ error: "Module not found in Course" });
    }

    if (currentEntry.order === 0) {
      return res.status(400).json({ message: "Module is already at the top" });
    }

    // Find the course above
    const aboveEntry = await Module.findOne({
      where: {
        courseId,
        order: currentEntry.order - 1
      }
    });

    if (!aboveEntry) {
      return res.status(400).json({ error: "No module above to swap with" });
    }

    // Swap orderIndexes
    const tempIndex = currentEntry.order;
    currentEntry.order = aboveEntry.order;
    aboveEntry.order = tempIndex;

    await currentEntry.save();
    await aboveEntry.save();

    res.json({ message: "Module moved up successfully" });
  } catch (error) {
    console.error("Move up error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get(
  "/api/admin/learning-path/:learningPathId/move-up/:courseId",
  authenticateToken,
  async (req, res) => {
    const { learningPathId, courseId } = req.params;

    try {
      // Find the current course entry
      const currentEntry = await LearningPathCourse.findOne({
        where: { learningPathId, courseId }
      });

      if (!currentEntry) {
        return res.status(404).json({ error: "Course not found in learning path" });
      }

      if (currentEntry.orderIndex === 0) {
        return res.status(400).json({ message: "Course is already at the top" });
      }

      // Find the course above
      const aboveEntry = await LearningPathCourse.findOne({
        where: {
          learningPathId,
          orderIndex: currentEntry.orderIndex - 1
        }
      });

      if (!aboveEntry) {
        return res.status(400).json({ error: "No course above to swap with" });
      }

      // Swap orderIndexes
      const tempIndex = currentEntry.orderIndex;
      currentEntry.orderIndex = aboveEntry.orderIndex;
      aboveEntry.orderIndex = tempIndex;

      await currentEntry.save();
      await aboveEntry.save();

      res.json({ message: "Course moved up successfully" });
    } catch (error) {
      console.error("Move up error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.post("/api/admin/category", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    // Validate request
    if (!name) {
      return res.status(400).json({ error: "Category name is required." });
    }

    // Update Category
    category = await Category.create({ name });

    const cat = await Category.findOne({
      where: { id: category.id },
      include: [
        { model: LearningPath, through: { attributes: [] }, as: "LearningPaths" },
        { model: Course, through: { attributes: [] }, as: "Courses" }
      ]
    });

    // Format response
    const formattedCategory = {
      id: cat.id,
      name: cat.name,
      learningPathCount: cat.LearningPaths ? cat.LearningPaths.length : 0,
      courseCount: cat.Courses ? cat.Courses.length : 0,
      text: `Used in ${cat.LearningPaths ? cat.LearningPaths.length : 0} Learning Paths and ${
        cat.Courses ? cat.Courses.length : 0
      } Courses`
    };

    // Return the updated category
    res.status(200).json(formattedCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/admin/category/:id/merge", authenticateToken, async (req, res) => {
  const { mergedCategoryId } = req.body;
  try {
    const merged = await Category.findOne({
      where: { id: mergedCategoryId },
      include: [
        { model: LearningPath, through: { attributes: [] }, as: "LearningPaths" },
        { model: Course, through: { attributes: [] }, as: "Courses" }
      ]
    });

    if (!merged) {
      return res.status(404).json({ error: "Category not found" });
    }

    const category = await Category.findOne({ where: { id: req.params.id } });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    for (var i = 0; i < merged.LearningPaths.length; i++) {
      await merged.LearningPaths[i].addCategory(category);
      await merged.LearningPaths[i].removeCategory(merged);
    }

    for (var i = 0; i < merged.Courses.length; i++) {
      await merged.Courses[i].addCategory(category);
      await merged.Courses[i].removeCategory(merged);
    }
    await merged.destroy();

    res.status(200).json({ message: "Category merged successfully" });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/admin/category/:id", authenticateToken, async (req, res) => {
  try {
    const category = await Category.findOne({ where: { id: req.params.id } });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    await category.destroy();

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/admin/category/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Validate request
    if (!name) {
      return res.status(400).json({ error: "Category name is required." });
    }

    // Find the existing Category
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: "Category not found." });
    }

    // Update Category
    await category.update({ name });

    const cat = await Category.findOne({
      where: { id: category.id },
      include: [
        { model: LearningPath, through: { attributes: [] }, as: "LearningPaths" },
        { model: Course, through: { attributes: [] }, as: "Courses" }
      ]
    });

    // Format response
    const formattedCategory = {
      id: cat.id,
      name: cat.name,
      learningPathCount: cat.LearningPaths ? cat.LearningPaths.length : 0,
      courseCount: cat.Courses ? cat.Courses.length : 0,
      text: `Used in ${cat.LearningPaths ? cat.LearningPaths.length : 0} Learning Paths and ${
        cat.Courses ? cat.Courses.length : 0
      } Courses`
    };

    // Return the updated category
    res.status(200).json(formattedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/admin/category", authenticateToken, async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [
        { model: LearningPath, through: { attributes: [] }, as: "LearningPaths" },
        { model: Course, through: { attributes: [] }, as: "Courses" }
      ]
    });

    // Format response
    const formattedCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      learningPathCount: category.LearningPaths ? category.LearningPaths.length : 0,
      courseCount: category.Courses ? category.Courses.length : 0,
      text: `Used in ${
        category.LearningPaths ? category.LearningPaths.length : 0
      } Learning Paths and ${category.Courses ? category.Courses.length : 0} Courses`
    }));

    res.status(200).json(formattedCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//region admin set test

app.put(
  "/api/admin/assessment/module/:moduleId/update/descriptions",
  authenticateToken,
  async (req, res) => {
    const { moduleId } = req.params;

    const { title, description, duration, numberOfQuestions, passMark } = req.body;

    // Input validation for passMark
    if (passMark !== undefined && passMark !== null) {
      const parsedPassMark = Number(passMark);

      if (isNaN(parsedPassMark)) {
        return res.status(400).json({ message: "Pass mark must be a number." });
      }

      if (parsedPassMark < 0 || parsedPassMark > 100) {
        return res.status(400).json({ message: "Pass mark must be between 0 and 100." });
      }
    }

    try {
      const module = await Module.findByPk(moduleId, {
        include: {
          model: Assessment
        }
      });

      if (!module) {
        return res.status(404).json({ message: "Module not found." });
      }

      const assessment = module.Assessment;

      if (!assessment) {
        return res.status(500).json({ message: "Assessment not found for the given module." });
      }

      const updateFields = {};
      if (title !== undefined) updateFields.title = title;
      if (description !== undefined) updateFields.description = description;
      if (duration !== undefined) updateFields.duration = duration;
      if (numberOfQuestions !== undefined) updateFields.numberOfQuestions = numberOfQuestions;
      if (passMark !== undefined) updateFields.passMark = Number(passMark); // Ensure it's a number after validation

      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ message: "No fields provided for update." });
      }

      await assessment.update(updateFields);

      res.status(200).json({ message: "Assessment updated successfully." });
    } catch (error) {
      console.error("Error updating assessment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.get("/api/admin/assessment/module/:moduleId", authenticateToken, async (req, res) => {
  const { moduleId } = req.params;

  try {
    const module = await Module.findByPk(moduleId, {
      include: {
        model: Assessment,
        include: {
          model: Question,
          include: Option
        }
      }
    });

    if (!module) {
      return res.status(404).json({ message: "Module not found." });
    }

    const modules = await Module.findAll({
      where: {
        courseId: module.courseId,
        content_type: { [Op.ne]: "assessment" }
      }
    });

    const assessment = module.Assessment;

    if (!assessment) {
      return res.json({
        moduleName: module.title,
        assessment: null,
        questions: [],
        modules: modules
      });
    }

    const formattedQuestions = assessment.Questions.sort((a, b) => a.id - b.id) // Sort questions by id
      .map((q) => ({
        id: q.id,
        aid: q.aid,
        question: q.text,
        module: q.module,
        answers: q.Options.sort((a, b) => a.id - b.id) // Sort options by id
          .map((opt) => ({
            id: opt.id,
            qid: opt.qid,
            text: opt.text,
            correct: opt.isCorrect
          }))
      }));

    res.json({
      moduleName: module.title,
      assessmentId: assessment.id,
      title: assessment.title,
      description: assessment.description,
      duration: assessment.duration,
      questions: formattedQuestions,
      modules: modules
    });
  } catch (error) {
    console.error("Error fetching module and assessment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//update questions
app.put("/api/admin/assessment/module/:moduleId", authenticateToken, async (req, res) => {
  const { moduleId } = req.params;
  const questionsPayload = req.body;

  try {
    const module = await Module.findByPk(moduleId);
    if (!module) return res.status(404).json({ message: "Module not found" });

    let assessment = await Assessment.findOne({ where: { moduleId } });

    if (!assessment) {
      assessment = await Assessment.create({ moduleId, title: "Default Title" });
    }

    // First, update or create questions and options based on the payload
    for (const q of questionsPayload) {
      let question;

      if (q.id) {
        // Try to update existing question
        question = await Question.findOne({ where: { id: q.id } });
        if (question) {
          question.text = q.question;
          question.module = q.module;
          await question.save();
        }
      } else {
        question = await Question.create({
          aid: q.aid,
          text: q.question,
          AssessmentId: assessment.id,
          module: q.module
        });
      }

      // Update existing options or create new ones
      for (const opt of q.answers) {
        if (opt.id) {
          const existingOpt = await Option.findOne({
            where: { id: opt.id }
          });
          if (existingOpt) {
            existingOpt.text = opt.text;
            existingOpt.isCorrect = opt.correct;
            await existingOpt.save();
          } else {
            await Option.create({
              qid: opt.qid,
              text: opt.text,
              isCorrect: opt.correct,
              QuestionId: question.id
            });
          }
        } else {
          if (!opt.delete) {
            await Option.create({
              qid: opt.qid,
              text: opt.text,
              isCorrect: opt.correct,
              QuestionId: question.id
            });
          }
        }

        if (opt.delete && opt.id) {
          const existingOpt = await Option.findOne({
            where: { id: opt.id }
          });
          if (existingOpt) {
            await existingOpt.destroy();
          }
        }
      }
    }

    // Fetch all the questions and their options after saving and deleting
    const updatedQuestions = await Question.findAll({
      where: { AssessmentId: assessment.id },
      include: {
        model: Option
      }
    });

    // Format the data to match the response payload format
    const formattedQuestions = updatedQuestions
      .sort((a, b) => a.id - b.id) // Sort questions by id
      .map((q) => ({
        id: q.id,
        aid: q.aid,
        question: q.text,
        module: q.module,
        answers: q.Options.sort((a, b) => a.id - b.id) // Sort options by id
          .map((opt) => ({
            id: opt.id,
            qid: opt.qid,
            text: opt.text,
            correct: opt.isCorrect
          }))
      }));

    // Send back a response with the message and updated questions
    res.json({
      message: "Assessment questions/answers saved successfully",
      questions: formattedQuestions
    });
  } catch (error) {
    console.error("Error saving questions and options:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//delete questions
app.delete("/api/admin/assessment/module/:moduleId", authenticateToken, async (req, res) => {
  const { moduleId } = req.params;
  const { questionId } = req.body;
  try {
    const question = await Question.findOne({ where: { id: questionId } });
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    await question.destroy();

    const module = await Module.findByPk(moduleId);
    if (!module) return res.status(404).json({ message: "Module not found" });

    let assessment = await Assessment.findOne({ where: { moduleId } });

    if (!assessment) {
      assessment = await Assessment.create({ moduleId, title: "Default Title" });
    }

    const updatedQuestions = await Question.findAll({
      where: { AssessmentId: assessment.id },
      include: {
        model: Option
      }
    });

    // Format the data to match the response payload format
    const formattedQuestions = updatedQuestions
      .sort((a, b) => a.id - b.id) // Sort questions by id
      .map((q) => ({
        id: q.id,
        aid: q.aid,
        question: q.text,
        answers: q.Options.sort((a, b) => a.id - b.id) // Sort options by id
          .map((opt) => ({
            id: opt.id,
            qid: opt.qid,
            text: opt.text,
            correct: opt.isCorrect
          }))
      }));

    // Send back a response with the message and updated questions
    res.json({
      message: "Question deleted successfully",
      questions: formattedQuestions
    });
  } catch (error) {
    console.error("Error saving questions and options:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//delete options
app.delete("/api/admin/assessment/module/option/:moduleId", authenticateToken, async (req, res) => {
  const { moduleId } = req.params;
  const { optionId } = req.body;
  try {
    const option = await Option.findOne({ where: { id: optionId } });
    if (!option) {
      return res.status(404).json({ message: "Option not found" });
    }

    await option.destroy();

    const module = await Module.findByPk(moduleId);
    if (!module) return res.status(404).json({ message: "Module not found" });

    let assessment = await Assessment.findOne({ where: { moduleId } });

    if (!assessment) {
      assessment = await Assessment.create({ moduleId, title: "Default Title" });
    }

    const updatedQuestions = await Question.findAll({
      where: { AssessmentId: assessment.id },
      include: {
        model: Option
      }
    });

    // Format the data to match the response payload format
    const formattedQuestions = updatedQuestions
      .sort((a, b) => a.id - b.id) // Sort questions by id
      .map((q) => ({
        id: q.id,
        aid: q.aid,
        question: q.text,
        answers: q.Options.sort((a, b) => a.id - b.id) // Sort options by id
          .map((opt) => ({
            id: opt.id,
            qid: opt.qid,
            text: opt.text,
            correct: opt.isCorrect
          }))
      }));

    // Send back a response with the message and updated questions
    res.json({
      message: "Question deleted successfully",
      questions: formattedQuestions
    });
  } catch (error) {
    console.error("Error saving questions and options:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//region get contents

app.get("/api/admin/contents", authenticateToken, async (req, res) => {
  try {
    const { type, sort, start = 0, limit = 10, categories, isPublished, search } = req.query; // Default: start at 0, limit 10

    let contents = [];
    if (categories) {
      const categoryList = categories.split(",").map((cat) => cat.trim());
      const categoryFilter = {
        include: [
          {
            model: Category,
            where: { name: { [Op.in]: categoryList } },
            through: { attributes: [] }
          }
        ]
      };

      if (!type || type === "both") {
        const learningPaths = await LearningPath.findAll(categoryFilter);
        const courses = await Course.findAll({ ...categoryFilter, where: { show_outside: true } });

        contents = [
          ...learningPaths.map((lp) => ({ ...lp.toJSON(), type: "Learning Path" })),
          ...courses.map((course) => ({ ...course.toJSON(), type: "Course" }))
        ];
      } else if (type === "learningpath") {
        const learningPaths = await LearningPath.findAll(categoryFilter);
        contents = learningPaths.map((lp) => ({ ...lp.toJSON(), type: "Learning Path" }));
      } else if (type === "course") {
        const courses = await Course.findAll({ ...categoryFilter, where: { show_outside: true } });
        contents = courses.map((course) => ({ ...course.toJSON(), type: "Course" }));
      }
    } else {
      if (!type || type === "both") {
        const learningPaths = await LearningPath.findAll();
        const courses = await Course.findAll({ where: { show_outside: true } });

        contents = [
          ...learningPaths.map((lp) => ({ ...lp.toJSON(), type: "Learning Path" })),
          ...courses.map((course) => ({ ...course.toJSON(), type: "Course" }))
        ];
      } else if (type === "learningpath") {
        const learningPaths = await LearningPath.findAll();
        contents = learningPaths.map((lp) => ({ ...lp.toJSON(), type: "Learning Path" }));
      } else if (type === "course") {
        const courses = await Course.findAll({ where: { show_outside: true } });
        contents = courses.map((course) => ({ ...course.toJSON(), type: "Course" }));
      }
    }

    if (search) {
      const searchLower = search.toLowerCase();
      contents = contents.filter(
        (content) =>
          content.title.toLowerCase().includes(searchLower) ||
          (content.description && content.description.toLowerCase().includes(searchLower))
      );
    }

    if (isPublished) {
      const isPublishedFilter = isPublished.toLowerCase() === "yes";
      contents = contents.filter((content) => content.is_published === isPublishedFilter);
    }

    // Sorting
    if (sort === "desc") {
      contents.sort((a, b) => b.title.localeCompare(a.title));
    } else {
      contents.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Pagination
    const startIdx = parseInt(start, 10);
    const limitNum = parseInt(limit, 10);
    const paginatedContents = contents.slice(startIdx, startIdx + limitNum);

    res.status(200).json({
      total: contents.length,
      start: startIdx,
      limit: limitNum,
      contents: paginatedContents
    });
  } catch (error) {
    console.error("Error fetching contents:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//region get single content

app.get("/api/admin/course-full/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch course
    const course = await Course.findOne({
      where: { id },
      include: [
        {
          model: Category,
          through: { attributes: [] },
          as: "Categories"
        },
        {
          model: LearningPath,
          through: { attributes: [] }
        }
      ]
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found." });
    }
    let modules = await Module.findAll({
      where: { courseId: id },
      order: [["order", "ASC"]]
    });

    // Format response
    const response = {
      id: course.id,
      title: course.title,
      image: course.image,
      description: course.description,
      show_outside: course.show_outside,
      is_published: course.is_published,
      categories: course.Categories?.map((cat) => ({ id: cat.id, name: cat.name })) || [],
      modules: modules?.map((mod) => ({ ...mod.dataValues })) || [],
      learningPaths:
        course.LearningPaths?.map((lp) => ({
          id: lp.id,
          title: lp.title
        })) || []
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/admin/learning-path-full/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch learning path
    const learningPath = await LearningPath.findOne({
      where: { id },
      include: [
        {
          model: Category,
          through: { attributes: [] },
          as: "Categories"
        },
        {
          model: Course,
          as: "Courses",
          include: [
            {
              model: Category,
              through: { attributes: [] },
              as: "Categories"
            }
          ],
          through: { attributes: ["orderIndex"] }
        }
      ]
    });

    if (!learningPath) {
      return res.status(404).json({ error: "Learning path not found." });
    }

    learningPath.Courses.sort((a, b) => {
      return a.LearningPathCourse.orderIndex - b.LearningPathCourse.orderIndex;
    });

    // Format response
    const response = {
      id: learningPath.id,
      title: learningPath.title,
      image: learningPath.image,
      description: learningPath.description,
      categories: learningPath.Categories?.map((cat) => ({ id: cat.id, name: cat.name })) || [],
      is_published: learningPath.is_published,
      difficulty: learningPath.difficulty,
      estimated_time: learningPath.estimated_time,
      courses:
        learningPath.Courses?.map((course) => ({
          id: course.id,
          title: course.title,
          description: course.description,
          categories: course.Categories?.map((cat) => ({ id: cat.id, name: cat.name })) || [],
          is_published: course.is_published
        })) || []
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching learning path:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/admin/learning-path-full/:id/acourses", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch learning path
    const learningPath = await LearningPath.findOne({
      where: { id }
    });

    if (!learningPath) {
      return res.status(404).json({ error: "Learning path not found." });
    }

    const allCourses = await Course.findAll({
      where: {
        show_outside: true
      },
      include: [
        {
          model: LearningPath,
          as: "LearningPaths",
          through: { attributes: [] }
        }
      ]
    });

    // Filter out courses that already belong to this learning path
    const coursesNotInLearningPath = allCourses.filter((course) => {
      return !course.LearningPaths.some((lp) => lp.id === learningPath.id);
    });

    const response = {
      courses: coursesNotInLearningPath.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        is_published: course.is_published
      }))
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching learning path:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
//region user management

app.get("/api/admin/users", authenticateToken, async (req, res) => {
  try {
    const { sort } = req.query;

    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    const { rows: users, count: totalUsers } = await User.findAndCountAll({
      attributes: [
        "id",
        "email",
        "image",
        "first_name",
        "last_name",
        "lastLogin",
        "isActive",
        "createdAt",
        "phone",
        "address",
        "city",
        "country",
        "postal_code",
        "tax_id"
      ],
      where: {
        isAdmin: false,
        [Op.or]: [
          { email: { [Op.iLike]: `%${search}%` } },
          { first_name: { [Op.iLike]: `%${search}%` } },
          { last_name: { [Op.iLike]: `%${search}%` } }
        ]
      },
      order: (() => {
        if (!sort) return [];
        const direction = sort.startsWith("-") ? "DESC" : "ASC";
        const field = sort.replace("-", "");
        const validFields = {
          email: "email",
          name: ["first_name", "last_name"],
          lastActive: "lastLogin",
          status: "isActive",
          dateAdded: "createdAt"
        };
        if (field === "name") {
          return [
            [validFields.name[0], direction],
            [validFields.name[1], direction]
          ];
        }
        if (field === "status") {
          let dir = "ASC";
          if (direction === "ASC") {
            dir = "DESC";
          }
          return [[validFields.status, dir]];
        }
        return validFields[field] ? [[validFields[field], direction]] : [];
      })(),
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    const totalPages = Math.ceil(totalUsers / limit);

    const formattedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      image: user.image,
      name: `${user.first_name} ${user.last_name}`,
      lastActive: user.lastLogin || "Never",
      status: user.isActive ? "Active" : "Inactive",
      dateAdded: user.createdAt,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      address: user.address,
      city: user.city,
      country: user.country,
      postal_code: user.postal_code,
      tax_id: user.tax_id,
      isActive: user.isActive
    }));

    res
      .status(200)
      .json({ totalUsers, totalPages, currentPage: parseInt(page, 10), users: formattedUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/admin/user", authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token missing" });
    }

    const {
      email,
      first_name,
      last_name,
      phone,
      address,
      city,
      postal_code,
      country,
      tax_id,
      image,
      password,
      confirm_password
    } = req.body;

    if (password !== confirm_password) {
      return res.status(400).json({ error: "Password and confirm password do not match" });
    }

    if (password === "" || password === null) {
      return res.status(400).json({ error: "Please Enter a Valid Password" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    await User.create({
      email,
      first_name,
      last_name,
      phone,
      address,
      city,
      postal_code,
      country,
      tax_id,
      password: hashedPassword
    });

    if (image && !image.startsWith("/media/")) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `${email}_profile_${Date.now()}.png`;
      const filePath = path.join(__dirname, "media", fileName);

      // Ensure the media directory exists
      const mediaDir = path.join(__dirname, "media");
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir);
      }

      // Save the image to the media folder
      fs.writeFileSync(filePath, buffer);

      // Update the user's image field with the file path
      await User.update({ image: `/media/${fileName}` }, { where: { email: email } });
    }
    const createdUser = await User.findOne({ where: { email: email } });

    res.json({
      message: "User created successfully",
      user: {
        email: createdUser.email,
        first_name: createdUser.first_name,
        last_name: createdUser.last_name,
        phone: createdUser.phone || "",
        address: createdUser.address || "",
        city: createdUser.city || "",
        postal_code: createdUser.postal_code || "",
        country: createdUser.country || "",
        tax_id: createdUser.tax_id || "",
        createdAt: createdUser.createdAt,
        image: createdUser.image || ""
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/admin/user/:id", authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token missing" });
    }

    const { id } = req.params;

    const { first_name, last_name, phone, address, city, postal_code, country, tax_id, image } =
      req.body;

    const user = await User.findOne({ where: { id } });
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
      message: "User updated successfully",
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
app.put("/api/admin/user/:id/disable", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the user by ID
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Update the user's status to inactive
    await user.update({ isActive: !user.isActive });

    res.status(200).json({ message: "User disabled successfully." });
  } catch (error) {
    console.error("Error disabling user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/admin/change/password/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    const { new_password, confirm_new_password } = req.body;

    if (new_password !== confirm_new_password) {
      return res.status(400).json({ error: "New password and confirm password do not match" });
    }

    if (new_password === "" || new_password === null) {
      return res.status(400).json({ error: "Please Enter a Valid Password" });
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

//region staff management

app.get("/api/admin/staffs", authenticateToken, async (req, res) => {
  try {
    const { sort } = req.query;

    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token missing" });
    }

    const chuser = await getUserByToken(token);

    const { rows: users, count: totalUsers } = await User.findAndCountAll({
      attributes: [
        "id",
        "email",
        "image",
        "first_name",
        "last_name",
        "lastLogin",
        "isActive",
        "createdAt",
        "phone",
        "address",
        "city"
      ],
      where: {
        isAdmin: true,
        email: { [Op.ne]: chuser.email },
        [Op.or]: [
          { email: { [Op.iLike]: `%${search}%` } },
          { first_name: { [Op.iLike]: `%${search}%` } },
          { last_name: { [Op.iLike]: `%${search}%` } }
        ]
      },

      order: (() => {
        if (!sort) return [];
        const direction = sort.startsWith("-") ? "DESC" : "ASC";
        const field = sort.replace("-", "");
        const validFields = {
          email: "email",
          name: ["first_name", "last_name"],
          lastActive: "lastLogin",
          status: "isActive",
          dateAdded: "createdAt"
        };
        if (field === "name") {
          return [
            [validFields.name[0], direction],
            [validFields.name[1], direction]
          ];
        }
        if (field === "status") {
          let dir = "ASC";
          if (direction === "ASC") {
            dir = "DESC";
          }
          return [[validFields.status, dir]];
        }
        return validFields[field] ? [[validFields[field], direction]] : [];
      })(),
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    const totalPages = Math.ceil(totalUsers / limit);

    const formattedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      image: user.image,
      name: `${user.first_name} ${user.last_name}`,
      lastActive: user.lastLogin || "Never",
      status: user.isActive ? "Active" : "Inactive",
      dateAdded: user.createdAt,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      address: user.address,
      city: user.city,
      isActive: user.isActive
    }));

    res
      .status(200)
      .json({ totalUsers, totalPages, currentPage: parseInt(page, 10), users: formattedUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/admin/staff", authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token missing" });
    }

    const {
      email,
      first_name,
      last_name,
      phone,
      address,
      city,
      image,
      password,
      confirm_password
    } = req.body;

    if (password !== confirm_password) {
      return res.status(400).json({ error: "Password and confirm password do not match" });
    }

    if (password === "" || password === null) {
      return res.status(400).json({ error: "Please Enter a Valid Password" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    await User.create({
      email,
      first_name,
      last_name,
      phone,
      address,
      city,
      password: hashedPassword,
      isAdmin: true
    });

    if (image && !image.startsWith("/media/")) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `${email}_profile_${Date.now()}.png`;
      const filePath = path.join(__dirname, "media", fileName);

      // Ensure the media directory exists
      const mediaDir = path.join(__dirname, "media");
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir);
      }

      // Save the image to the media folder
      fs.writeFileSync(filePath, buffer);

      // Update the user's image field with the file path
      await User.update({ image: `/media/${fileName}` }, { where: { email: email } });
    }
    const createdUser = await User.findOne({ where: { email: email } });

    res.json({
      message: "User created successfully",
      user: {
        email: createdUser.email,
        first_name: createdUser.first_name,
        last_name: createdUser.last_name,
        phone: createdUser.phone || "",
        address: createdUser.address || "",
        city: createdUser.city || "",
        createdAt: createdUser.createdAt,
        image: createdUser.image || ""
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/admin/staff/:id", authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token missing" });
    }

    const { id } = req.params;

    const { first_name, last_name, phone, address, city, postal_code, country, tax_id, image } =
      req.body;

    const user = await User.findOne({ where: { id } });
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
      message: "Staff updated successfully",
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
app.put("/api/admin/staff/:id/disable", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token missing" });
    }

    const chuser = await getUserByToken(token);

    if (!chuser) {
      return res.status(404).json({ error: "User not found" });
    }
    const chuser2 = await User.findOne({ where: { email: chuser.email } });

    // Find the user by ID
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    if (chuser2.createdAt > user.createdAt) {
      return res.status(403).json({
        error: "Action denied: You cannot disable an account that was created before your own."
      });
    }

    // Update the user's status to inactive
    await user.update({ isActive: !user.isActive });

    res.status(200).json({ message: "User disabled successfully." });
  } catch (error) {
    console.error("Error disabling user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/feedback
app.post("/api/feedback", authenticateToken, async (req, res) => {
  const { courseId, LearningPathId, text } = req.body;

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  const chuser = await getUserByToken(token);

  const userId = chuser.id;

  // Basic Input Validation
  if ((!courseId && !LearningPathId) || !userId || !text) {
    if (!text) {
      return res.status(400).json({ message: "Please enter a feedback message." });
    }
    return res.status(400).json({ message: "Failed to send request" });
  }

  try {
    let newFeedback = await Feedback.findOne({
      where: {
        userId: userId,
        courseId: courseId || null,
        LearningPathId: LearningPathId || null
      }
    });
    if (newFeedback) {
      await newFeedback.update({
        text: text
      });
    } else {
      newFeedback = await Feedback.create({
        userId: userId,
        courseId: courseId || null,
        LearningPathId: LearningPathId || null,
        text: text
      });
    }

    res.status(201).json({ message: "Feedback sent successfully.", feedback: newFeedback });
  } catch (error) {
    console.error("Error creating feedback:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

app.get("/api/admin/feedback/:id/:type/:limit/:page", authenticateToken, async (req, res) => {
  const { id, type } = req.params;
  let { limit, page } = req.params;

  try {
    limit = parseInt(limit, 10);
    page = parseInt(page, 10);

    // 1. Validate limit and page
    if (isNaN(limit) || limit <= 0) {
      return res
        .status(400)
        .json({ message: "Invalid 'limit' parameter. Must be a positive integer." });
    }
    if (isNaN(page) || page <= 0) {
      return res
        .status(400)
        .json({ message: "Invalid 'page' parameter. Must be a positive integer." });
    }

    // 2. Calculate offset for pagination
    const offset = (page - 1) * limit;

    let feedbackQueryResult; // This will hold the result of the feedback query

    // Define base query options for feedback, WITHOUT the 'include'
    const feedbackQueryOptions = {
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]] // Assuming 'createdAt' is a timestamp field
      // Removed: include property
    };

    // 3. Fetch paginated feedback items
    if (type === "course") {
      feedbackQueryResult = await Feedback.findAndCountAll({
        where: { courseId: id },
        ...feedbackQueryOptions
      });
    } else if (type === "learningpath") {
      feedbackQueryResult = await Feedback.findAndCountAll({
        where: { LearningPathId: id },
        ...feedbackQueryOptions
      });
    } else {
      return res
        .status(400)
        .json({ message: "Invalid 'type' parameter. Must be 'course' or 'learningpath'." });
    }

    const { count, rows: rawFeedbackList } = feedbackQueryResult;

    // --- Start Manual User Fetching ---

    // 4. Extract all unique userId's from the fetched feedback list
    // Use Set to ensure uniqueness and filter out any null/undefined userId (if applicable)
    const userIds = [
      ...new Set(rawFeedbackList.map((feedback) => feedback.userId).filter(Boolean))
    ];

    let users = [];
    if (userIds.length > 0) {
      // 5. Fetch all users whose IDs are in the extracted list
      users = await User.findAll({
        where: {
          id: {
            [Op.in]: userIds // Use Op.in for a clean 'IN' clause
          }
        },
        attributes: ["id", "first_name", "last_name", "image"] // Select only the necessary user attributes
      });
    }

    // 6. Create a map for quick lookup of user data by ID
    const userMap = new Map();
    users.forEach((user) => userMap.set(user.id, user.toJSON())); // Convert to plain JSON object for consistency

    // 7. Attach the user data to each feedback item
    const feedbackListWithUsers = rawFeedbackList.map((feedback) => {
      const feedbackJson = feedback.toJSON(); // Convert Sequelize instance to plain object
      feedbackJson.User = userMap.get(feedbackJson.userId) || null; // Attach the user object, or null if user not found
      return feedbackJson;
    });

    // --- End Manual User Fetching ---

    // 8. Send back the paginated data along with total count and page info
    res.status(200).json({
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      feedback: feedbackListWithUsers // Send the enriched feedback list
    });
  } catch (error) {
    console.error("Error fetching feedback (manual user fetch):", error); // Changed message for clarity
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

app.get("/api/feedback/:id/:type", authenticateToken, async (req, res) => {
  const { id, type } = req.params;
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }

  const chuser = await getUserByToken(token);

  const userId = chuser.id;
  try {
    let feedback;
    if (type === "course") {
      feedback = await Feedback.findOne({
        where: {
          userId: userId,
          courseId: id
        }
      });
    } else {
      feedback = await Feedback.findOne({
        where: {
          userId: userId,
          learningPathId: id
        }
      });
    }

    if (feedback) {
      res.status(200).json({ text: feedback.text });
    } else {
      res.status(200).json({ text: "", message: "No feedback found" });
    }
  } catch (error) {
    console.error("Error fetching all feedback:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});
