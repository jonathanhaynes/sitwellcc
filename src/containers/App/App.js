import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch,
} from 'react-router-dom';
import './App.css';

import About from '../About/About';
import ClubRides from '../ClubRides/ClubRides';
import Kit from '../Kit/Kit';
import Membership from '../Membership/Membership';
import News from '../News/News';
import Contact from '../Contact/Contact';

import NotFound from '../../NotFound';

const App = (props) => (
  <Router>
    <Switch>
      <Route exact path='/' render={routeProps => <div {...routeProps} prismicCtx={props.prismicCtx}><h1>Home</h1></div>}/>

      <Route path='/about' render={routeProps => <About {...routeProps} prismicCtx={props.prismicCtx} />} />
      <Route path='/club-rides' render={routeProps => <ClubRides {...routeProps} prismicCtx={props.prismicCtx} />} />
      <Route path='/kit' render={routeProps => <Kit {...routeProps} prismicCtx={props.prismicCtx} />} />
      <Route path='/membership' render={routeProps => <Membership {...routeProps} prismicCtx={props.prismicCtx} />} />
      <Route path='/news' render={routeProps => <News {...routeProps} prismicCtx={props.prismicCtx} />} />
      <Route path='/contact' render={routeProps => <Contact {...routeProps} prismicCtx={props.prismicCtx} />} />

      <Route component={NotFound} />
    </Switch>
  </Router>
);

export default App;
