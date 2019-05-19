import React from 'react';
import {
  Route,
  BrowserRouter as Router,
} from 'react-router-dom';

// Components
import LandingPage from './containers/LandingPage';

const App = () => (
  <Router>
    <div className="App">
      <Route exact path="/" component={LandingPage} />
    </div>
  </Router>
);

export default App;
