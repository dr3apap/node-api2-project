const Joi = require("joi");
const express = require("express");
const db = require("../../data/db");
const shortid = require("shortid");

const router = express.Router();

// | POST   | /api/posts| Creates a post using the information sent inside the `request body`.
router.post("/", (req, res) => {
  const postsInfo = req.body;
  const schema = {
    title: Joi.string().required(),
    contents: Joi.string().required(),
  };
  const result = Joi.validate(postsInfo, schema);
  if (postsInfo) {
    db.insert(postsInfo)
      .then(postsInfo => {
        res.status(201).json(postsInfo);
        const savePost = postsInfo.save();
        return;
      })

      .catch(error => {
        res.status(500).json({
          error: "There was an error while saving the post to the database",
        });
        return;
      });
  } else {
    res.status(400).send(result.error.details[0].message);
  }
});

//| POST | /api/posts/:id/comments | Creates a comment for the post with the specified id using information sent inside of the `request body`.
// router.post("/:id/comments", (req, res) => {
//   console.log("in the comments");
//   const commentId = req.params.id;
//   const schema = {
//     text: Joi.string().required(),
//     commentId: Joi.string()
//       .min(2)
//       .required(),
//   };
//   const { error, values } = Joi.validate(commentId, schema);
//   const valid = error == null;
//   if (valid) {
//     db.insertComment({ ...req.body, post_id: commentId })
//       .then(commentId => {
//         // res.status(201).json(commentId[])
//         let comments = db.findCommentById(id);
//         res.status(201).json(comments);
//         let saveComment = commentId.save();

//         if (!commentId && schema.hasOwnProperty(prop)) {
//           for (const prop in schema) {
//             res.status(500).json(schema[prop]);

//             saveComment = res.status(404).json({
//               error:
//                 "There was an error while saving the comment to the database",
//             });
//           }
//         }
//       })
//       .catch(err => {
//         res
//           .status(404)
//           .json({ err: "The post with the specified ID does not exist." });
//       });
//   }
// });

router.post("/:id/comments", (req, res) => {
  const commentId = req.params.id;
  const schema = {
    text: Joi.string().required(),
    commentId: Joi.string()
      .min(2)
      .required(),
  };
  const result = Joi.validate(commentId, schema);
  if (commentId) {
    db.insertComment({ ...req.body, post_id: commentId })
      .then(commentId => {
        res.status(201).json(commentId);
        const savePost = commentId.save();
        return;
      })

      .catch(error => {
        res.status(404).json({
          error: "The post with the specified ID does not exist.",
        });
        return;
      });
  } else {
    res.status(500).send(result.error.details[0].message);
  }
});

//| GET | /api/posts| Returns an array of all the post objects contained in the database.

router.get("/", async (req, res) => {
  try {
    let posts = await db.find();
    res.status(200).json(posts);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ error: "The posts information could not be retrieved." });
  }
});

//| GET| /api/posts/:id          | Returns the post object with the specified id.

router.get("/:id", async (req, res) => {
  try {
    let posts = await db.findById(req.params.id);
    if (posts.length === 0) {
      res
        .status(404)
        .json({ message: "The post with the specified ID does not exist." });
    } else {
      const post = posts[0];
      res.status(200).json(post);
    }
  } catch {
    res.status(500).json({
      error:
        "Internal server error. The posts information could not be retrieved.",
    });
  }
});

//| GET | /api/posts/:id/comments | Returns an array of all the comment objects associated with the post with the specified id.

router.get("/:id/comments", async (req, res) => {
  try {
    let posts = await db.findById(req.params.id);
    if (posts.length === 0) {
      res.status(404).json({
        message: `The post with the ID ${req.params.id} does not exist.`,
      });
    } else {
      let comments = await db.findPostComments(req.params.id);
      if (comments.length > 0) {
        res.status(200).json(comments);
      } else {
        res.status(404).json({
          error: `Could not find any comments for post id ${req.params.id}.`,
        });
      }
    }
  } catch {
    res
      .status(500)
      .json({ error: "The comments information could not be retrieved." });
  }
});
//| DELETE | /api/posts/:id | Removes the post with the specified id and returns the **deleted post object**. You may need to make additional calls to the database in order to satisfy this requirement. |

router.delete("/:id", async (req, res) => {
  try {
    let posts = await db.findById(req.params.id);
    if (posts.length === 0) {
      res
        .status(404)
        .json({ message: "The post with the specified ID does not exist." });
    } else {
      const post = posts[0];
      await db.remove(req.params.id);
      res.status(200).json(post);
    }
  } catch {
    res.status(500).json({ error: "The post could not be removed" });
  }
});

//| PUT | /api/posts/:id | Updates the post with the specified `id` using data from the `request body`. Returns the modified document, **NOT the original**.

router.put("/:id", async (req, res) => {
  if (!req.body.title || !req.body.contents) {
    res
      .status(400)
      .json({
        errorMessage: "Please provide title and contents for the post.",
      });
  } else {
    try {
      await db.update(req.params.id, req.body);
      let posts = await db.findById(req.params.id);
      res.status(200).json(posts[0]);
    } catch {
      res
        .status(500)
        .json({ error: "The post information could not be modified." });
    }
  }
});

module.exports = router;
