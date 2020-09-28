import React, {Component} from "react";
import {History} from "history";

import {Global} from "../../store/global/types";
import {Account} from "../../store/accounts/types";

import UserAvatar from "../user-avatar";
import ProfileLink from "../profile-link"

import {getLeaderboard, LeaderBoardDuration, LeaderBoardItem} from "../../api/private";

import {informationSvg} from "../../img/svg";
import DropDown from "../dropdown";
import Tooltip from "../tooltip";
import LinearProgress from "../linear-progress";

import {_t} from "../../i18n";

import _c from "../../util/fix-class-names"

interface Props {
    global: Global;
    history: History;
    addAccount: (data: Account) => void;
}

interface State {
    data: LeaderBoardItem[],
    period: LeaderBoardDuration,
    loading: boolean
}

export class LeaderBoard extends Component <Props, State> {

    state: State = {
        data: [],
        period: "day",
        loading: true
    }

    _mounted: boolean = true;

    componentDidMount() {
        this.fetch();
    }

    componentWillUnmount() {
        this._mounted = false;
    }

    stateSet = (state: {}, cb?: () => void) => {
        if (this._mounted) {
            this.setState(state, cb);
        }
    };

    fetch = () => {
        const {period} = this.state;
        this.stateSet({loading: true, data: []});

        getLeaderboard(period).then(data => {
            this.stateSet({data});
            this.stateSet({loading: false});
        });
    }

    render() {

        const {data, period, loading} = this.state;

        const menuItems = [
            ...["day", "week", "month"].map((f => {
                return {
                    label: _t(`leaderboard.period-${f}`),
                    onClick: () => {
                        this.stateSet({period: f});
                        this.fetch();
                    }
                }
            }))
        ]

        const dropDownConfig = {
            history: this.props.history,
            label: '',
            items: menuItems
        };

        return (
            <div className={_c(`leaderboard-list ${loading ? "loading" : ""}`)}>
                <div className="list-header">
                    <div className="list-filter">
                        {_t('leaderboard.title')} <DropDown {...dropDownConfig} float="left"/>
                    </div>
                    <div className="list-title">
                        {_t(`leaderboard.title-${period}`)}
                    </div>
                </div>
                {loading && <LinearProgress/>}
                {data.length > 0 && (
                    <div className="list-body">
                        <div className="list-body-header">
                            <span/>
                            <Tooltip content={_t('leaderboard.header-score-tip')}>
                            <span className="score">
                                {informationSvg} {_t('leaderboard.header-score')}
                            </span>
                            </Tooltip>
                            <span className="points">
                               {_t('leaderboard.header-reward')}
                            </span>
                        </div>

                        {data.map((r, i) => {

                            return <div className="list-item" key={i}>
                                <div className="index">{i + 1}</div>
                                <div className="avatar">
                                    {ProfileLink({
                                        ...this.props,
                                        username: r._id,
                                        children: <a>{UserAvatar({...this.props, size: "medium", username: r._id})}</a>
                                    })}
                                </div>
                                <div className="username">
                                    {ProfileLink({
                                        ...this.props,
                                        username: r._id,
                                        children: <a>{r._id}</a>
                                    })}
                                </div>
                                <div className="score">
                                    {r.count}
                                </div>
                                <div className="points">
                                    {r.points !== '0.000' && `${r.points} POINTS`}
                                </div>
                            </div>;
                        })}
                    </div>
                )}

            </div>
        );
    }
}


export default (p: Props) => {
    const props: Props = {
        global: p.global,
        history: p.history,
        addAccount: p.addAccount
    };

    return <LeaderBoard {...props} />
}
