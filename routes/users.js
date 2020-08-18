const bcrypt = require('bcryptjs');
const express = require('express');
const router = express.Router();
const data = require('../data');
const xss = require('xss');
const userData = data.users;
const taskData = data.tasks;
const projectData = data.pojects;

router.get("/:id", (req, res) => {
    userData
      .getUser(req.params.id)
      .then(user => {
        res.json(user);
      })
      .catch(() => {
        res.status(404).json({ error: "User not found" });
      });
});

router.post("/register", (req, res) => {
    let userInfo = req.body;
    if (!userInfo) {
      res.status(400).json({
          error: 'You must provide information to sign up.',
      });
      return;
    }
  
    try {
      const newUser = await userData.addUser(
        userInfo.firstName, 
        userInfo.lastName, 
        userInfo.email, 
        userInfo.passwordHash, 
        userInfo.username, 
        userInfo.description, 
        userInfo.created=[], 
        userInfo.participant=[]
      );
      res.json(newUser);
    } catch (error) {
      res.status(500).json({ error: error });
    }
});

router.put("/:id", (req, res) => {
  let userInfo = req.body;

  let getUser = userData
    .getUser(req.params.id)
    .then(() => {
      return userData.updateUser(req.params.id, userInfo).then(
        updatedUser => {
          res.json(updatedUser);
        },
        () => {
          res.sendStatus(500);
        }
      );
    })
    .catch(() => {
      res.status(404).json({ error: "User not found" });
    });
});

router.post('/account/login', async (req, res) => {
    let username = req.body.username;
    let password = req.body.passwordHash;

    if (!username) {
        res.status(400).json({
            error: 'You must provide a username to login',
        });
        return;
    }

    if (!password) {
        res.status(400).json({
            error: 'You must provide a password to login',
        });
        return;
    }

    try {
        const user = await userData.getUserByName(username);
        let comparePasswords = await bcrypt.compare(password,user.hashedPassword);
        
        if (!comparePasswords) {
            res.status(401).json({ error: 'Password incorrect' });
            return;
        }

        let sessionUser = { _id: user._id, userName: xss(user.userName) };
        res.cookie('user', JSON.stringify(sessionUser));
        req.session.user = user._id;
        res.status(200).json(user);
    } catch (error) {
        res.status(404).json({ error: 'Incorrect password or username' });
    }
});

router.get('/logout', async (req, res) => {
    try {
        req.session.user = undefined;
        res.status(200).json({ message: 'Logout successful!' });
    } catch (error) {
        res.status(500).json({ error: 'Logout failed' });
    }
});

module.exports = router;