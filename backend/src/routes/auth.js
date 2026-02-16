const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma= require("../db.cjs");

const router=express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { email, password ,phone,name} = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Missing fields" });

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

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user)
      return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

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
