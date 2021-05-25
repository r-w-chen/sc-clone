const express = require('express');
const asyncHandler = require('express-async-handler');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const {multipleFieldsMulterUpload, multipleMulterUpload, singleMulterUpload, multiplePublicFileUpload, singlePublicFileUpload } = require('../../awsS3');
const { User, Song } = require('../../db/models');
const router = express.Router();


router.get('/', asyncHandler(async (req, res) => {
    //may want to eagerload Comments
    const songs = await Song.findAll({include: User});
    res.json({songs})
}));

router.get('/user/:userId', asyncHandler(async (req, res) => {
    const {userId} = req.params;
    const userSongs = await Song.findAll({
        where: { userId },
    })
    console.log(userSongs);
    res.json({userSongs})
}))


const songFields = [
    {name: 'audioImg'},
    {name: 'audioFile'}
]
router.post('/', multipleFieldsMulterUpload(songFields) ,asyncHandler(async (req, res) => {
    const {title, genre, description, userId } = req.body;
    const song = Song.build({
        title,
        genre,
        description,
        userId
    })
    let songImgURL = null;
    //throws an error if image is not added
    if(req.files.audioImg){
        songImgURL = await singlePublicFileUpload(req.files.audioImg[0])

    }   
    const audioURL = await multiplePublicFileUpload(req.files.audioFile);

    song.songImgURL = songImgURL;
    song.audioURL = audioURL[0];

    // console.log("SONG IMAGE URL", songImgURL)
    // console.log("SONG URL", audioURL)

    // *** change to create() instead of build/save()
    await song.save(); 
    res.json({song});
}));

router.delete('/:id', asyncHandler(async (req, res) => {
    //TODO: add and id key to the req to be used for searching here
    //query for song by ID and do song.destroy();
    const { id } = req.params
    const song = await Song.findByPk(id);
    await song.destroy();
    res.json({message: "successfully deleted"})
}));

router.patch('/', singleMulterUpload('audioImg'), asyncHandler(async (req, res) => {
    //TODO: query for song by ID and do a song.update()
    const {title, genre, description, id, noAudioImg} = req.body;
    const songToUpdate = await Song.findByPk(id);
    // console.log("what is req.file?", req.file);
    //may want to see what URL is currently tied to the img so i can delete from s3
    let songImgURL = null;
    if(req.file){
        songImgURL = await singlePublicFileUpload(req.file)
    }

    await songToUpdate.update({
        title,
        genre,
        description,
        songImgURL
    })
    // console.log("updatedSong", songToUpdate);
    res.json({songToUpdate})
}));

module.exports = router;