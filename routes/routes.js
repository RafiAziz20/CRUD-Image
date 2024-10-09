const express = require("express");
const router = express.Router();
const User = require("../models/users");
const multer = require("multer");
const fs = require("fs");

//image upload
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});

var upload = multer({
  storage: storage,
}).single("image");

// Insert an user into database route
router.post("/add", upload, async (req, res) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    image: req.file.filename,
  });

  try {
    await user.save();
    req.session.message = {
      type: "success",
      message: "User added successfully!",
    };
    res.redirect("/");
  } catch (err) {
    res.json({ message: err.message, type: "danger" });
  }
});

// Get all users route
router.get("/", async (req, res) => {
  try {
    const users = await User.find().exec();
    res.render("index", {
      title: "Home Page",
      users: users,
    });
  } catch (err) {
    res.json({ message: err.message });
  }
});

router.get("/add", (req, res) => {
  res.render("add_users", { title: "Add Users" });
});

// Edit an user route
router.get("/edit/:id", async (req, res) => {
  let id = req.params.id;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.redirect("/"); // User not found, redirect to home
    }
    res.render("edit_users", {
      title: "Edit User",
      user: user,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/"); // Redirect to home on error
  }
});

// Update user route
router.post("/update/:id", upload, async (req, res) => {
  let id = req.params.id;
  let new_image = "";

  // Cek apakah ada file baru yang diupload
  if (req.file) {
    new_image = req.file.filename;

    // Hapus gambar lama jika ada
    try {
      fs.unlinkSync("./uploads/" + req.body.old_image);
    } catch (err) {
      console.log(err);
    }
  } else {
    new_image = req.body.old_image; // Jika tidak ada file baru, gunakan gambar lama
  }

  try {
    // Gunakan await untuk memanggil findByIdAndUpdate
    await User.findByIdAndUpdate(
      id,
      {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: new_image,
      },
      { new: true } // Mengembalikan dokumen yang diperbarui
    );

    req.session.message = {
      type: "success",
      message: "User updated successfully!",
    };
    res.redirect("/");
  } catch (err) {
    req.session.message = {
      type: "danger",
      message: "Failed to update user!",
    };
    res.redirect(`/edit/${id}`);
  }
});

// Delete User route
router.get("/delete/:id", async (req, res) => {
  let id = req.params.id;
  try {
    // Menggunakan await untuk memanggil findByIdAndDelete
    const result = await User.findByIdAndDelete(id);
    // Memastikan bahwa pengguna ditemukan dan dihapus
    if (result) {
      // Menghapus gambar terkait dari folder uploads
      if (result.image) {
        try {
          fs.unlinkSync("./uploads/" + result.image);
        } catch (err) {
          console.log(err);
        }
      }
      req.session.message = {
        type: "success",
        message: "User deleted successfully!",
      };
    } else {
      req.session.message = {
        type: "danger",
        message: "User not found!",
      };
    }
    res.redirect("/");
  } catch (err) {
    console.log(err);
    req.session.message = {
      type: "danger",
      message: "Failed to delete user!",
    };
    res.redirect("/");
  }
});

module.exports = router;
