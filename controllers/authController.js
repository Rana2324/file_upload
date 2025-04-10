import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Create JWT token
const maxAge = 3 * 24 * 60 * 60; // 3 days in seconds
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: maxAge,
  });
};

// Password hashing function
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt();
  return await bcrypt.hash(password, salt);
};

// Compare password function
const comparePassword = async (candidatePassword, hashedPassword) => {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

// Handle errors
const handleErrors = (err) => {
  let errors = { username: "", email: "", password: "" };

  // Duplicate error
  if (err.code === 11000) {
    if (err.keyPattern.email) {
      errors.email = "That email is already registered";
    }
    if (err.keyPattern.username) {
      errors.username = "That username is already registered";
    }
    return errors;
  }

  // Validation errors
  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  // Login errors
  if (err.message === "Incorrect email") {
    errors.email = "That email is not registered";
  }
  if (err.message === "Incorrect password") {
    errors.password = "That password is incorrect";
  }

  return errors;
};

// Export functions individually
export const signup_get = (req, res) => {
  res.render("register");
};

export const login_get = (req, res) => {
  res.render("login");
};

export const signup_post = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Hash password before creating user
    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = createToken(user._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(201).json({ user: user._id });
  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
};

export const login_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw Error("Incorrect email");
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      throw Error("Incorrect password");
    }

    // Create and send token
    const token = createToken(user._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(200).json({ user: user._id });
  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
};

export const logout_get = (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.redirect("/");
};

// Also maintain default export for backward compatibility
const authController = {
  signup_get,
  login_get,
  signup_post,
  login_post,
  logout_get,
};

export default authController;
