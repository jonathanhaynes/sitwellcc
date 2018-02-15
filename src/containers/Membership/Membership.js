import React from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';

import Page from '../Page/Page';
import NotFound from '../../NotFound';

const Membership = (props) => (
  <Switch>
    <Route exact path='/membership' render={routeProps => <h1>Membership</h1>}/>
    <Route path='/membership/:title' render={routeProps => <Page {...routeProps} prismicCtx={props.prismicCtx} />}/>

    <Route component={NotFound} />
  </Switch>
);

export default Membership;
