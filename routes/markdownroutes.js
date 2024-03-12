const express = require('express');
const router = express.Router();
const Markdown = require('../models/markdownschema'); 
const User = require('../models/user');

// Create a new markdown document
router.post('/create-markdown', async (req, res) => {
  

  try {
    const { content } = req.body;
    const newMarkdown = new Markdown({ content });
    await newMarkdown.save();
    res.status(201).send(newMarkdown);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Server error' });
  }
});




// Get all markdown documents
router.get('/markdown-list', async (req, res) => {
  try {
    const markdownList = await Markdown.find();
    res.send(markdownList);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Server error' });
  }
});

// Get a single markdown document by ID
router.get('/markdown/:id', async (req, res) => {
  try {
    const markdown = await Markdown.findById(req.params.id);
    if (!markdown) {
      return res.status(404).send({ message: 'Markdown document not found' });
    }
    res.send(markdown);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Server error' });
  }
});

// Update a markdown document
// router.put('/update-markdown/:id', async (req, res) => {
//   try {
//     const { content } = req.body;
//     const updatedMarkdown = await Markdown.findByIdAndUpdate(
//       req.params.id,
//       { content },
//       { new: true }
//     );
//     if (!updatedMarkdown) {
//       return res.status(404).send({ message: 'Markdown document not found' });
//     }
//     res.send(updatedMarkdown);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ message: 'Server error' });
//   }
// });


// Update a markdown document
router.put('/update-markdown/:id', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).send({ message: 'Content is required' });
    }

    const updatedMarkdown = await Markdown.findByIdAndUpdate(
      req.params.id,
      { content },
      { new: true }
    );

    if (!updatedMarkdown) {
      return res.status(404).send({ message: 'Markdown document not found' });
    }

    res.send(updatedMarkdown);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Server error' });
  }
});


// Delete a markdown document
router.delete('/delete-markdown/:id', async (req, res) => {
  try {
    const deletedMarkdown = await Markdown.findByIdAndRemove(req.params.id);
    if (!deletedMarkdown) {
      return res.status(404).send({ message: 'Markdown document not found' });
    }
    res.send({ message: 'Markdown document deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Server error' });
  }
});

// Fetch data for chart
router.get('/fetch-data', async (req, res) => {
  try {
    const totalMarkdowns = await Markdown.countDocuments();
    const totalUsers = await User.countDocuments();
    res.json({ totalMarkdowns, totalUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;