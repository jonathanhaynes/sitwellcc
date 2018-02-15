import React from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';

import Page from '../Page/Page';
import NotFound from '../../NotFound';

const ClubRides = (props) => (
  <Switch>
    <Route exact path='/club-rides' render={routeProps => <h1>Club Rides</h1>}/>
    <Route path='/club-rides/:title' render={routeProps => <Page {...routeProps} prismicCtx={props.prismicCtx} />}/>

    <Route component={NotFound} />
  </Switch>
);

export default ClubRides;
