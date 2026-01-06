import {Router} from 'express';
import { verifyJWT } from '../middlewares/auth.middlewares.js';
import { upload } from '../middlewares/multer.middlewares.js';
import { createPost, editPost, getPostById, getMyPosts, getAllPosts, deletePost } from '../controllers/blog.controllers.js';    
const router = Router();

router.route('/').post(
    verifyJWT,
    upload.fields([
        {
            name: 'images',
            maxCount: 1
        }
    ]),
    createPost
)

router.route('/:id').patch(
    verifyJWT,
    upload.fields([
        {
            name: 'images',
            maxCount: 1
        }
    ]),
    editPost
)

router.route('/:id').get(
    getPostById
)

router.route('/me/posts').get(
    verifyJWT,
    getMyPosts
);

router.route('/').get(
    getAllPosts
);

router.route('/:id').delete(
    verifyJWT,
    deletePost
);


export default router;