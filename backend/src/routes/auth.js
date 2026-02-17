const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma= require("../db.cjs");
const rateLimit = require("express-rate-limit");
const validator = require("validator");

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

const router=express.Router();


const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { message: "Too many login attempts. Try again later." },
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10, 
  message: { message: "Too many accounts created. Try again later." },
});


router.post("/signup",signupLimiter, async (req, res) => {
  try {
    const { email, password ,phone,name} = req.body;
   
if (!email || !password || !name || !phone) {
  return res.status(400).json({ message: "Missing required fields" });
}

if (!validator.isEmail(email)) {
  return res.status(400).json({ message: "Invalid email format" });
}

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

if (!passwordRegex.test(password)) {
  return res.status(400).json({
    message:
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
  });
}

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser)
      return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role:"CANDIDATE",
        },
      });

      await tx.candidate.create({
        data: {
          userId: newUser.id,
          name: name,
          phone: phone,
        },
      });

      return newUser;
    });

    const token = jwt.sign(
      { userId: user.id ,
        role:user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.status(201).json({
      message: "User created",
      token,
      userId: user.id,
      role:user.role
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/signin",loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

if (!user) {
  return res.status(401).json({ message: "Invalid credentials" });
}

if (user.lockUntil && user.lockUntil > new Date()) {
  return res.status(423).json({
    message: "Account temporarily locked. Try again later."
  });
}

const isMatch = await bcrypt.compare(password, user.password);

if (!isMatch) {
  const attempts = user.failedLoginAttempts + 1;

  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockUntil: new Date(Date.now() + LOCK_TIME)
      }
    });

    return res.status(423).json({
      message: "Too many failed attempts. Account locked for 15 minutes."
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: attempts }
  });

  return res.status(401).json({ message: "Invalid credentials" });
}

await prisma.user.update({
  where: { id: user.id },
  data: {
    failedLoginAttempts: 0,
    lockUntil: null
  }
});

    const token = jwt.sign(
      { userId: user.id ,
        role:user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token ,role:user.role,userId:user.id});
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
