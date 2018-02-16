import React from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';

import NotFound from '../../NotFound';

const Kit = (props) => (
  <Switch>
    <Route exact path={props.match.path} render={routeProps => <h1>Kit</h1>}/>

    <Route component={NotFound} />
  </Switch>
);

export default Kit;
