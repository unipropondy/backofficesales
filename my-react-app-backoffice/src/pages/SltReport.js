// import "./Home.css";

// function Home() {
//   return (
//     <div
//       className="home"
//       style={{
//         backgroundImage: `url(${process.env.PUBLIC_URL}/bg.png)`,
//       }}
//     >
//       <div className="home-card">
//         <h1>Welcome Bavani 👋</h1>
//         <p>This is your Home page with background image.</p>
//       </div>
//     </div>
//   );
// }

// export default Home;
import "./Home.css";

function Home() {
  return (
    <div
      className="home"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/bg.png)`,
      }}
    >
      <div className="home-card">
        <h1>Welcome caffee👋</h1>
        {/* <p>This is your Home page with background image.</p> */}
      </div>
    </div>
  );
}

export default Home;

