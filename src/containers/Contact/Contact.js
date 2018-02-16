import React from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';

import NotFound from '../../NotFound';

const Contact = (props) => (
  <Switch>
    <Route exact path={props.match.path} render={routeProps => <h1>Contact</h1>}/>

    <Route component={NotFound} />
  </Switch>
);

export default Contact;
