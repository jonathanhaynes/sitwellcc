import React from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';

import Rides from '../../components/Rides/Rides';
import NotFound from '../../NotFound';

const ClubRides = (props) => (
  <Switch>
    <Route exact path={props.match.path} render={routeProps => <h1>Club Rides</h1>}/>
    <Route path={`${props.match.path}/:title`} render={routeProps => <Rides {...routeProps} prismicCtx={props.prismicCtx} />}/>

    <Route component={NotFound} />
  </Switch>
);

export default ClubRides;
