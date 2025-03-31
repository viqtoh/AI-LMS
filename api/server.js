const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authenticateToken = require("./middleware/auth");
const pool = require("./db");
const {
  User,
  LearningPath,
  Category,
  Course,
  Module,
  UserProgress,
  LearningPathCourse
} = require("./models");

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

    res.status(201).json({ learningPath });
  } catch (error) {
    console.error("Error creating learning path:", error);
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
      image,
      difficulty,
      estimated_time,
      is_published
    });

    // If categoryIds exist and are not empty, associate them
    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      const categories = await Category.findAll({ where: { id: categoryIds } });

      if (categories.length !== categoryIds.length) {
        return res.status(404).json({ error: "One or more categories not found." });
      }

      // Add new categories without removing existing ones
      await learningPath.addCategories(categories);
    }

    res.status(200).json({ learningPath });
  } catch (error) {
    console.error("Error updating learning path:", error);
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

    // Return the updated category
    res.status(200).json(category);
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

//region get contents

app.get("/api/admin/contents", authenticateToken, async (req, res) => {
  try {
    const { type, sort, start = 0, limit = 10 } = req.query; // Default: start at 0, limit 10

    let contents = [];

    if (!type || type === "both") {
      // Fetch both Learning Paths and Courses
      const learningPaths = await LearningPath.findAll({
        include: [{ model: Category, through: { attributes: [] } }]
      });

      const courses = await Course.findAll({
        include: [{ model: Category, through: { attributes: [] } }]
      });

      // Add "type" attribute and merge into one array
      contents = [
        ...learningPaths.map((lp) => ({ ...lp.toJSON(), type: "Learning Path" })),
        ...courses.map((course) => ({ ...course.toJSON(), type: "Course" }))
      ];
    } else if (type === "learningpath") {
      // Fetch only Learning Paths
      const learningPaths = await LearningPath.findAll({
        include: [{ model: Category, through: { attributes: [] } }]
      });

      contents = learningPaths.map((lp) => ({ ...lp.toJSON(), type: "Learning Path" }));
    } else if (type === "course") {
      // Fetch only Courses
      const courses = await Course.findAll({
        include: [{ model: Category, through: { attributes: [] } }]
      });

      contents = courses.map((course) => ({ ...course.toJSON(), type: "Course" }));
    } else {
      return res.status(400).json({ error: "Invalid type parameter." });
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

app.get("/api/admin/learning-path-full/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

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
          as: "Courses"
        }
      ]
    });

    if (!learningPath) {
      return res.status(404).json({ error: "Learning path not found." });
    }

    // Format response
    const response = {
      id: learningPath.id,
      title: learningPath.title,
      image: learningPath.image,
      description: learningPath.description,
      categories: learningPath.Categories?.map((cat) => cat.name) || [],
      courses:
        learningPath.Courses?.map((course) => ({
          id: course.id,
          title: course.title,
          description: course.description,
          categories: course.Categories?.map((cat) => cat.name) || []
        })) || []
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching learning path:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
