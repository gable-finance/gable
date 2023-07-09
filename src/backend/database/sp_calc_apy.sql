/* STORED PROCEDURE: SP_CALC_APY */

--  Generates the staking, interest and total APY
-- 
--  The staking and interest APY are calculated by:
--      (1) Retrieving the most recent and the latest epochs (within a 7 day timewindow).
--      (2) Extracting the earnings per epoch of nft #1# (reference) for those two intervals
--      (3) Calculate the base value and the comparison value for the yields
--          (3.1) Staking: take the recent value (latest staked XRD + recent staking rewards) and latest value (latest staked XRD + latest staking rewards)
--          (3.2) Interest: take the recent value (latest staking rewards + recent interest earnings) and latest value (latest staking rewards + latest interest earnings)
--      (4) Calculate the yield per considered timewindow 
--          (i.e. recent = 07-01-2023 and latest = 02-01-2023 => timewindow = 6 days)
--      (5) Extending the yield to annually by dividing 365 days with the timewindow
--          and subsequently multiplying the yield with it

CREATE OR REPLACE PROCEDURE insert_apy_data()
LANGUAGE plpgsql
AS $$
BEGIN
    WITH time_window AS (
        SELECT
            (SELECT MAX(timestamp) - INTERVAL '7 days' FROM user_info) AS start_time,
            (SELECT MAX(timestamp) FROM user_info) AS end_time
    )
    INSERT INTO apy_data (
        epoch,
        timestamp,
        staking_rewards_apy,
        interest_earnings_apy,
        total_earnings_apy
    )
    SELECT
        epoch,
        recent_timestamp AS timestamp,
        ((recent_staking_rewards_relative - latest_staking_rewards_relative) / latest_staking_rewards_relative)
            * (365 / EXTRACT(DAY FROM (recent_timestamp - latest_timestamp))) 
                AS staking_rewards_apy,

        ((recent_interest_earnings_relative - latest_interest_earnings_relative) / latest_interest_earnings_relative)
            * (365 / EXTRACT(DAY FROM (recent_timestamp - latest_timestamp))) 
                AS interest_earnings_apy, 
                
        ( 1 + ((recent_staking_rewards_relative - latest_staking_rewards_relative) / latest_staking_rewards_relative)
                * (365 / EXTRACT(DAY FROM (recent_timestamp - latest_timestamp))))      
            * 
                ( 1 + ((recent_interest_earnings_relative - latest_interest_earnings_relative) / latest_interest_earnings_relative)
                        * (365 / EXTRACT(DAY FROM (recent_timestamp - latest_timestamp))))   
                    - 1 AS total_earnings_apy

    FROM (
        SELECT
            recent_entry.epoch,
            recent_entry.timestamp AS recent_timestamp,
            latest_entry.timestamp AS latest_timestamp,
            latest_entry.stake + recent_entry.staking_rewards  AS recent_staking_rewards_relative,
            latest_entry.staking_rewards + recent_entry.interest_earnings AS recent_interest_earnings_relative,
            latest_entry.stake + latest_entry.staking_rewards  AS latest_staking_rewards_relative,
            latest_entry.staking_rewards + latest_entry.interest_earnings AS latest_interest_earnings_relative
        FROM (
            SELECT
                ui.epoch,
                ui.timestamp AS timestamp,
                1000 AS stake,
                ui.lsu_amount AS lsu_amount,
                ui.staking_rewards AS staking_rewards,
                ui.interest_earnings AS interest_earnings
            FROM user_info ui
            JOIN time_window tw ON ui.timestamp >= tw.start_time AND ui.timestamp <= tw.end_time
            WHERE ui.nft_id = '#1#'
            ORDER BY ui.timestamp DESC
            LIMIT 1
        ) AS recent_entry
        CROSS JOIN (
            SELECT
                ui.epoch,
                ui.timestamp AS timestamp,
                1000 AS stake,
                ui.lsu_amount AS lsu_amount,
                ui.staking_rewards AS staking_rewards,
                ui.interest_earnings AS interest_earnings
            FROM user_info ui
            JOIN time_window tw ON ui.timestamp >= tw.start_time AND ui.timestamp <= tw.end_time
            WHERE ui.nft_id = '#1#'
            ORDER BY ui.timestamp ASC
            LIMIT 1
        ) AS latest_entry
    ) AS apy;
END;
$$;