import { Request, Response } from "express";
import { prisma } from "../../db/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// --- REGISTER ---
export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, phone, password, role } = req.body;

    // 1. Check if user exists
    


    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });


    

    if (existingUser) {
      return res.status(400).json({ message: "Phone number already registered" });
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create User (Default to BENEFICIARY if role not sent)
    // Security Note: In a real app, you might restrict creating OFFICER accounts
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        password: hashedPassword,
        role: role || "BENEFICIARY", 
      },
    });

    

    return res.status(201).json({
      message: "User registered successfully",
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role }
    });

  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// --- LOGIN ---
export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { phone, password } = req.body;

    // 1. Find User
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid phone or password" });
    }

    // 2. Check Password



    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid phone or password" });
    }

    // 3. Generate Token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "7d" }
    );
    
    
    // 4. Send Response
    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        // Send profile completion status to help frontend
        profileComplete: !!(user.state && user.income) 
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};