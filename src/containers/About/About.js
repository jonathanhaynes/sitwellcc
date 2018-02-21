import React from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';

import Page from '../../components/Page/Page';
import NotFound from '../../NotFound';

const About = (props) => (
  <Switch>
    <Route exact path={props.match.path} render={routeProps => <h1>About</h1>}/>
    <Route path={`${props.match.path}/:title`} render={routeProps => <Page {...routeProps} prismicCtx={props.prismicCtx} />}/>

    <Route component={NotFound} />
  </Switch>
);

export default About;
