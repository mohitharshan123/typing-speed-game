import React, {
  useEffect,
  useRef,
  useReducer,
  useState,
  Fragment,
  useCallback,
} from "react";
import { Dialog, Transition } from "@headlessui/react";

import randomWords from "random-words";
import { textReducer } from "../reducers/textReducer";
import ChristmasLogo from "../assets/christmas.svg";
import Snowman from "../assets/snowman.jpg";
import database from "../firebase";
import {
  onSnapshot,
  collection,
  query,
  updateDoc,
  doc,
} from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";

const Input = () => {
  const [randomText, dispatch] = useReducer(textReducer, []);
  const textContainer = useRef();
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [gameStarted, setGameStarted] = useState(false);
  const [isScorePopupOpen, setIsScorePopupOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [speed, setSpeed] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [topScore, setTopScore] = useState(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [playerName, setPlayerName] = useState();
  const [docId, setDocId] = useState("");

  let textRefs = [];

  const calculateSpeedAndAccuracy = useCallback(() => {
    const correctEntriesCount = randomText.filter(
      ({ correct }) => correct
    ).length;
    const attemptedCount = randomText.filter(
      ({ attempted }) => attempted
    ).length;
    setAccuracy(Math.floor((correctEntriesCount / attemptedCount) * 100));
  }, [randomText]);

  useEffect(() => {
    if (secondsRemaining === 0) {
      if (
        speed * (accuracy / 100) >
        topScore.speed * (topScore.accuracy / 100)
      ) {
        setIsNewHighScore(true);
      }
      setIsScorePopupOpen(true);
      setGameStarted(false);
      calculateSpeedAndAccuracy();
    }
    let timer =
      secondsRemaining > 0 &&
      gameStarted &&
      setInterval(() => {
        setSecondsRemaining((secondsRemaining) => secondsRemaining - 1);
      }, 1000);

    return () => clearInterval(timer);
  }, [
    secondsRemaining,
    gameStarted,
    accuracy,
    speed,
    topScore?.accuracy,
    topScore?.speed,
    calculateSpeedAndAccuracy,
  ]);

  const TopScorer = ({ playerInfo: { player, speed, accuracy } }) => (
    <div className="flex flex-col w-full h-full space-y-3 ">
      <p className="font-semibold">Top Score</p>
      <p className="font-semibold">{player}</p>
      <div className="flex flex-row space-x-10">
        <div className="flex flex-col space-y-3 ">
          <p className="font-light">Speed</p>
          <div className="bg-indigo-500 shadow-lg p-3 text-white rounded-full shadow-indigo-500/50">
            {speed} WPM
          </div>
        </div>

        <div className="flex flex-col space-y-3 ">
          <p className="font-light">Accuracy</p>
          <div className="bg-indigo-500 shadow-lg p-3 text-white rounded-full shadow-indigo-500/50">
            {accuracy} %
          </div>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    loadText();
    const q = query(collection(database, "topscore"));
    onSnapshot(q, (querySnapshot) => {
      setDocId(querySnapshot.docs[0].id);
      setTopScore(querySnapshot.docs[0].data());
      toast(<TopScorer playerInfo={querySnapshot.docs[0].data()} />, {
        closeButton: false,
        closeOnClick: false,
        autoClose: false,
        position: "bottom-right",
      });
    });
  }, []);

  const loadText = () => {
    dispatch({
      type: "SET_TEXT",
      payload: randomWords(100)
        .join(", ")
        .split(",")
        .join("")
        .split("")
        .map((letter) => ({
          incorrect: false,
          letter,
          correct: false,
          attempted: false,
        })),
    });
  };

  const handlePlayAgain = () => {
    setIsScorePopupOpen(false);
    loadText();
    setSecondsRemaining(60);
    setInputText("");
    textContainer.current.scrollLeft = 0;
  };

  const updateHighScore = () => {
    const newTopScorer = doc(database, "topscore", docId);
    const newPlayerDetails = { player: playerName, speed, accuracy };
    updateDoc(newTopScorer, newPlayerDetails);
    setIsScorePopupOpen(false);
  };

  const handleKeyDown = (key, index) => {
    if (key === " ") setSpeed((speed) => speed + 1);
    setGameStarted(true);
    dispatch({ type: "ATTEMPTED", payload: index });
    if (randomText[index]?.letter !== key) {
      dispatch({ type: "INCORRECT", payload: index });
    } else {
      textContainer.current.scrollLeft += 15;
      dispatch({ type: "CORRECT", payload: index });
    }
    textRefs[index]?.scrollIntoView({ behaviour: "smooth", block: "end" });
  };

  return (
    <>
      <img src={ChristmasLogo} className="opacity-40 px-3" alt="Christmas" />
      <div className="h-20 w-1/4 absolute flex flex-col items-center justify-center top-5 bg-transparent border-dotted border-4 border-cyan-400">
        <p
          className={`h-full m-auto text-center text-6xl font-medium text-amber-${
            secondsRemaining > 40
              ? "200"
              : secondsRemaining > 30
              ? "300"
              : secondsRemaining > 10
              ? "400"
              : "900"
          }`}
        >
          {secondsRemaining}
        </p>
      </div>
      <div className="w-3/4 absolute top-40" ref={textContainer}>
        {randomText.map(({ incorrect, letter, correct }, idx) => (
          <span
            key={idx}
            id={idx}
            ref={(ref) => textRefs.push(ref)}
            className={`shadow-cyan-500/50 whitespace-nowrap  ${
              incorrect
                ? "text-red-600"
                : correct
                ? "text-green-400"
                : "text-amber-200"
            } leading-10 font-medium text-5xl `}
          >
            {letter}
          </span>
        ))}
      </div>
      <input
        onKeyDown={(event) => {
          const {
            key,
            target: { selectionStart },
          } = event;
          handleKeyDown(key, selectionStart);
        }}
        value={inputText}
        onChange={({ target: { value } }) => setInputText(value)}
        autoFocus
        placeholder="Start Typing..."
        className="bg-transparent text-3xl px-4 font-medium	text-amber-400  rounded-full ring-offset-2 ring font-mono ring-blue-500 scroll-smooth whitespace-nowrap absolute w-3/4 overflow-scroll h-20 "
      ></input>
      <Transition appear show={isScorePopupOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto w-full flex flex-col h-50"
          onClose={() => setIsScorePopupOpen(false)}
        >
          <div className="min-h-screen px-4 text-center w-full">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0" />
            </Transition.Child>

            <span
              className="inline-block h-full align-middle"
              aria-hidden="true"
            ></span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 items-center flex justify-center text-gray-900"
                >
                  <img src={Snowman} className="h-96 mb-10" alt="Snowman" />
                </Dialog.Title>
                <div className="flex flex-col items-center m-3 h-full">
                  {isNewHighScore && (
                    <div className="font-bold m-3 flex flex-col space-y-3 h-full">
                      <p>Congratulations!!! Thats a new high score!</p>
                      <input
                        onChange={({ target: { value } }) =>
                          setPlayerName(value)
                        }
                        placeholder="Enter your name"
                        className="border border-blue-200 h-full w-full p-3 rounded-md"
                      />
                      <button
                        onClick={updateHighScore}
                        className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-blue-900 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                      >
                        Save
                      </button>
                    </div>
                  )}

                  <div className="flex h-full flex-row w-full justify-between items-center   space-x-20 mb-10">
                    <div className="flex flex-col space-y-3 items-center">
                      <p className="font-bold">Speed</p>
                      <div className="rounded-full text-6xl text-white w-full bg-indigo-500 shadow-lg p-10 shadow-indigo-500/50">
                        {speed} WPM
                      </div>
                    </div>
                    <div className="flex flex-col space-y-3 items-center">
                      <p className="font-bold">Accuracy</p>
                      <div className="rounded-full text-6xl text-white w-full bg-indigo-500 shadow-lg p-10 shadow-indigo-500/50">
                        {accuracy}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-blue-900 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                    onClick={handlePlayAgain}
                  >
                    Play Again
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
      <ToastContainer />
    </>
  );
};

export default Input;
