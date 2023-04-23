import React from "react";
import ndjsonStream from "can-ndjson-stream";
import { useEffect, useState } from "react";

const baseURL =
  //  "https://raw.githubusercontent.com/json-iterator/test-data/master";
  "https://dl.dropboxusercontent.com/s/gxbsj271j5pevec";
//"https://raw.githubusercontent.com/ozlerhakan/mongodb-json-files/master/datasets";

const URLPath =
  // "large-file.json"
  "trades.json";
//"city_inspections.json";

const testPayLoadURL = `${baseURL}/${URLPath}`;

const INITIAL_LOAD = 1;
const LOAD_INCREMENT = 10;

const fetchNdjson = (setval, count, setCount, more, setMore) => {
  console.log("fetching");
  let streamedValues = [];
  let moreData = [];
  let loadInitial = true;
  (async () => {
    const response = await fetch(testPayLoadURL);
    const exampleReader = ndjsonStream(response.body).getReader();

    let result;
    console.log("reading");
    while (
      (!result || !result.done) &&
      loadInitial &&
      streamedValues.length < INITIAL_LOAD
    ) {
      setCount(count++);
      result = await exampleReader.read();
      streamedValues.push(result.value);
      console.log("first 1 values");
      if (streamedValues.length === INITIAL_LOAD) {
        setval((prev) => {
          return [...prev, streamedValues];
        });
      }
      loadInitial = false;
      console.log(
        count,
        result.value?.id,
        result.done,
        result.value,
        streamedValues.length
      );
    }
    const loadMore = async () => {
      while (moreData.length < 20) {
        result = await exampleReader.read();
        moreData.push(result.value);
        console.log("loading more!!!", result.value?._id?.$oid);
      }

      if (moreData.length === 20) {
        setval((prev) => {
          const temp = moreData;
          moreData = [];
          return [...prev, temp];
        });
      }

      // recurse until complete
      if (!result.done)
        setTimeout(async () => {
          await loadMore();
          console.log("another batch");
        }, 1000);
    };

    if (!result.done) await loadMore();
  })();
};

export default () => {
  const [val, setVal] = useState([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchNdjson(setVal, count, setCount);
  }, []);

  return (
    <>
      <h2>Streaming Results:</h2>
      {JSON.stringify(val)}
      {/*{JSON.stringify(*/}
      {/*  val.map((obj) => {*/}
      {/*    const el = obj[0];*/}
      {/*    console.log("ALL", obj);*/}
      {/*    // const { _id, price, ticker, shares } = el;*/}
      {/*    if (el) {*/}
      {/*      return `ID: ${el?._id.$oid}: The price is ${el?.price} for ${el?.ticker} with ${el?.shares} shares.`;*/}
      {/*    }*/}
      {/*  })*/}
      {/*)}*/}
    </>
  );
};
