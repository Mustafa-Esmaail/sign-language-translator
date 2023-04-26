import React, { useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import Webcam from "react-webcam";
import { drawHand } from "./utilities";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
// import imgTest from "./gaaf.png";
import { useEffect } from "react";

function Alphabet() {
  const imgcamRef = useRef(null);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [tfReady, setTfRead] = useState(false);
  const [mark, setMark] = useState([]);
  const [letter, setLetter] = useState([]);
  const classesNames = [
    "ain",
    "al",
    "aleff",
    "bb",
    "dal",
    "dha",
    "dhad",
    "fa",
    "gaaf",
    "ghain",
    "ha",
    "haa",
    "jeem",
    "kaaf",
    "khaa",
    "la",
    "laam",
    "meem",
    "nothing",
    "nun",
    "ra",
    "saad",
    "seen",
    "sheen",
    "ta",
    "taa",
    "thaa",
    "thal",
    "toot",
    "waw",
    "ya",
    "yaa",
    "zay",
  ];
  useEffect(
    ()=>{
        const runHandpose = async () => {
            const vision = await FilesetResolver.forVisionTasks(
              // path/to/wasm/root
              "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            const landmarkModel = await HandLandmarker.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task`,
              },
              numHands: 2,
            });
            console.log("Handpose model loaded.");
        
            const handModel = await tf.loadLayersModel(
              "https://raw.githubusercontent.com/Mustafa-Esmaail/arabic-sign-language/sign-lang-model-v1/model.json"
            );
        
            setTfRead(true);
            console.log(tfReady);
            //  Loop and detect hands
            setInterval(() => {
            detect(landmarkModel, handModel);
            }, 100);
          };
  runHandpose();
          
  },[])

 
  const calc_landmark_list = (width, height, landmarks) => {
    // console.log(landmarks);
    const landmark_point = [];

    landmarks.map((landmark) => {
      const landmark_x = Math.min(Number(landmark.x * width), width - 1);
      const landmark_y = Math.min(Number(landmark.y * height), height - 1);
      landmark_point.push([landmark_x, landmark_y]);
    });
    // })
    // console.log(landmark_point)

    return landmark_point;
  };

  const pre_process_landmark = (landmark_list) => {
    let temp_landmark_list = landmark_list;
    var base_x = 0;
    var base_y = 0;
    let marks = [];
    temp_landmark_list.map((point, index) => {
      if (index === 0) {
        base_x = temp_landmark_list[index][0];

        base_y = temp_landmark_list[index][1];
      }
      temp_landmark_list[index][0] = temp_landmark_list[index][0] - base_x;
      temp_landmark_list[index][1] = temp_landmark_list[index][1] - base_y;
      marks.push(temp_landmark_list[index][0]);
      marks.push(temp_landmark_list[index][1]);
    });


    const max_value = Math.max.apply(null, marks.map(Math.abs));

    marks.map((point, idx) => {
      marks[idx] = marks[idx] / max_value;
    });
    setMark(marks);
    return marks;
  };

  const detect = async (landmarkModel, handMode) => {
    // Check data is available
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Set canvas height and width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Make Detections
      const landmark = await landmarkModel.detect(video);
      landmark.landmarks.map((landmarks) => {
        const landmark_list = calc_landmark_list(
            videoWidth,
            videoHeight,
          landmarks
        );
        // console.log(landmark_list);

        const Prelandmark_list = pre_process_landmark(landmark_list);
        // console.log(Prelandmark_list);
        const tfMark = tf.tensor(Prelandmark_list).reshape([1, 42]);

        // console.log(tfMark);

        const prediction = handMode.predict(tfMark);
        const handResult = prediction.dataSync();
        const arr = Array.from(handResult);
        const maxPredict = Math.max.apply(null, arr);
        const idx = arr.indexOf(maxPredict);
        // console.log(prediction.print());
        // console.log(classesNames[idx]);
        setLetter(letter.push(classesNames[idx]))

        setMark(Prelandmark_list);
      });
     

      // Draw mesh
      const ctx = canvasRef.current.getContext("2d");
      drawHand(mark, ctx);
    }
  };


  return (
    <div id="portfolio" className="text-center">
      <div className="container">
        <div className="section-title">
          <h2>Try Model</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit duis sed
            dapibus leonec.
          </p>
        </div>
        <div className="row">

        <Webcam
          ref={webcamRef}
          style={{
            marginLeft: "auto",
            marginRight: "auto",
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            top:0,
            right:0,
            left:0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />
        </div>
        <div className="section-result">
          <h2>Result</h2>
          <p>
            {letter.map((letter,idx)=>{
                return(letter);
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Alphabet;
