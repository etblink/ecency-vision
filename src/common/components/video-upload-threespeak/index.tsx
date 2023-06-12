import React, { useState, ChangeEvent, useEffect, useRef } from 'react'
import { videoSvg, uploadSvgV } from '../../img/svg'
import { Button, Modal } from "react-bootstrap";
import { _t } from '../../i18n';
import "./index.scss";
import { threespeakAuth, getAllVideoStatuses, uploadVideoInfo, updateInfo } from '../../api/threespeak';
import * as tus from "tus-js-client";
import VideoGallery from "../video-gallery";

export const VideoUpload = (props: any) => {
  const { 
    insertText,
    accessToken,
    description,
    title,
    tags,
    activeUser,
    global
  } = props;

  const tusEndPoint = "https://uploads.3speak.tv/files/";
  const fileInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

    const [showModal, setShowModal] = useState(false)
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [coverImage, setCoverImage] = useState<any>(null)
    const [step, setStep] = useState("upload")
    const [videoId, setVideoId] = useState("")
    const [videoUrl, setVideoUrl] = useState("")
    const [thumbUrl, setThumbUrl] = useState("")
    const [fileName, setFileName] = useState("")
    const [fileSize, setFileSize] = useState(0)
    const [videoPercentage, setVideoPercentage] = useState("")
    const [thumbPercentage, setThumbPercenrage] = useState("")
    const [ isNsfwC, setIsNsfwC] = useState(false);
    const [showGaller, setShowGallery] = useState(false);

    const canUpload = thumbUrl && videoUrl
    const canUpdate = thumbUrl && videoUrl && title && tags && description

    useEffect(() =>{
      threespeakAuth(activeUser!.username)
    },[]);

    const hideModal = () => { 
      setShowModal(false)
    }

    const onChange: any = (event: { target: { files: any[] } }, type: string) => {
      let file = event.target.files[0];
  
      let upload: any = new tus.Upload(file, {
        // Endpoint is the upload creation URL from your tus server
        endpoint: tusEndPoint,
        // Retry delays will enable tus-js-client to automatically retry on errors
        retryDelays: [0, 3000, 5000, 10000, 20000],
        // Attach additional meta data about the file for the server
        metadata: {
          filename: file.name,
          filetype: file.type
        },
        // Callback for errors which cannot be fixed using retries
        onError: function (error: Error) {
          return console.log( error);
        },
        // Callback for reporting upload progress
        onProgress: function (bytesUploaded: number, bytesTotal: number) {
          let vPercentage;
          let tPercentage;
          if (type === "video") {
            vPercentage  = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
            setVideoPercentage(vPercentage)
          } else {
            tPercentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
            setThumbPercenrage(tPercentage)
          }
        },
        // Callback for once the upload is completed
        onSuccess: function () {
          console.log("File %s", upload.file?.name);
          console.log("URL %s", upload?.url.replace("https://uploads.3speak.tv/files/", ""));
          let file = upload?.url.replace(this.endpoint, "");
          if (type === "video") {
            setVideoUrl(file);
            setFileName(upload.file?.name);
            setFileSize(upload.file?.size);
          } else {
            setThumbUrl(file);
            setFileName(upload.file?.name);
            setFileSize(upload.file?.size);
          }
        }
      });
      upload.start();
    };

    const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement | any>) => {
      const file: any = e?.target?.files[0];
      onChange(e, "thumbnail")
      console.log(file)
      setCoverImage(URL?.createObjectURL(file));
    };

    const handleVideoChange = (e: ChangeEvent<HTMLInputElement | any>) => {
      const file: any = e?.target?.files[0];
      onChange(e, "video")
      console.log(file)
      setSelectedFile(URL?.createObjectURL(file));
    };

    const uploadInfo = async ()=> {
      console.log("testing if it works...")
     const data = await uploadVideoInfo(activeUser!.username, videoUrl, thumbUrl, fileName, fileSize)
        setVideoId(data._id)
        setIsNsfwC(data.isNsfwContent)
        console.log(data)
    }

    const checkStat = async () => {
      const token = await threespeakAuth(activeUser!.username)
      const allStatus = await getAllVideoStatuses(token)
      console.log(allStatus)
      return allStatus;
    }    

    const updateSpeakVideo = async () => {
      const token = await threespeakAuth(activeUser!.username)
      console.log(videoId)
      console.log(token, description, videoId, title, tags)
      updateInfo(token, description, videoId, title, tags, isNsfwC)
    }

    const uploadVideoModal = (
        <div className="dialog-content">
          <div className="file-input">
            <label htmlFor="video-input">Choose video {uploadSvgV}</label>
              <input
                type="file"
                ref={fileInput}
                accept="video/*"
                id="video-input"
                style={{display: "none"}}
                onChange={handleVideoChange}
              />
              <div className="progresss">
                {Number(videoPercentage) > 0 && <>
                  <div style={{width: Number(videoPercentage) + "%"}} className="progress-bar"/>
                  <span >{`${videoPercentage}%`}</span>
                </>}
              </div>
          </div>
          <div className="file-input">
            <label htmlFor="image-input">Chose thumbnail {uploadSvgV}</label>
            <input
              type="file"
              ref={fileInput}
              accept="image/*"
              id="image-input"
              style={{display: "none"}}
              onChange={handleThumbnailChange}
            />
            <div className="progresss">
              {Number(thumbPercentage) > 0 && <>
                <div style={{width: Number(thumbPercentage) + "%"}} className="progress-bar"/>
                <span >{`${thumbPercentage}%`}</span>
              </>}
            </div>
          </div>
            <Button
            disabled={!canUpload}
            onClick={()=> {
              uploadInfo();
              setStep("update")
            }}>Upload Video</Button>
        </div>
    )

    const updateVideoModal = (
      <div className="dialog-content">
        <div className="file-input">
          <video controls poster={coverImage}>
            <source src={selectedFile} type="video/mp4" />
          </video>
        </div>
        <div className="d-flex">
          <Button className="bg-dark" onClick={()=> {
            setStep("upload")
            console.log(description, title, tags)
          }}
          >Back</Button>
            <Button 
            className="ml-5" 
            disabled={!canUpdate}
            onClick={() => {
              updateSpeakVideo()
              }}>Update info
            </Button>
        </div>
      </div>
    );
    
  return (
    <div className="mt-2 cursor-pointer new-feature">
        <div className="d-flex justify-content-center bg-red">
          { videoSvg }
          {activeUser && (
            <div className="sub-tool-menu">
              <div
                className="sub-tool-menu-item"
                onClick={() => setShowModal(true)}
              >
                {_t("editor-toolbar.upload")} video
              </div>
              {global.usePrivate && (
                <div
                  className="sub-tool-menu-item"
                  onClick={(e: React.MouseEvent<HTMLElement>) => {
                    e.stopPropagation();
                    setShowGallery(true)
                    // this.toggleGallery();
                  }}
                >
                  Video {_t("editor-toolbar.gallery")}
                </div>
              )}
            </div>
          )}
        </div>
        <VideoGallery 
        showGaller={showGaller} 
        setShowGallery={setShowGallery} 
        checkStat={checkStat} 
        selectedFile={selectedFile}
        />
        <div>
          <Modal
            animation={false}
            show={showModal}
            centered={true}
            onHide={hideModal}
            keyboard={false}
            className="add-image-modal"
            // size="lg"
        >
            <Modal.Header closeButton={true}>
              <Modal.Title>
                {step === "upload" && <p>Upload Video</p>}
                {step === "update" && <p>Preview</p>}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {step === "upload" && uploadVideoModal}
              {step === "update" && updateVideoModal}
            </Modal.Body>
          </Modal>
        </div>        
    </div>
  )
}
