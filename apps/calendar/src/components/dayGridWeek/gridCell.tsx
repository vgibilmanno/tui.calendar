import { h } from 'preact';

import { useTheme } from '@src/contexts/theme';
import { cls } from '@src/helpers/css';

type Props = {
  isLastCell: boolean;
  width: string;
  left: string;
} & ExceedCountProps &
  CollapseButtonProps;

interface ExceedCountProps {
  index: number;
  exceedCount: number;
  isClicked: boolean;
  onClickExceedCount: (exceedCount: number) => void;
}

interface CollapseButtonProps {
  isClicked: boolean;
  isClickedIndex: boolean;
  onClickCollapseButton: () => void;
}

function ExceedCount({ index, exceedCount, isClicked, onClickExceedCount }: ExceedCountProps) {
  const clickExceedCount = () => onClickExceedCount(index);
  const style = { display: isClicked ? 'none' : '' };

  return exceedCount && !isClicked ? (
    <span
      className={cls('weekday-exceed-in-week')}
      onClick={clickExceedCount}
      style={style}
    >{`+${exceedCount}`}</span>
  ) : null;
}

function CollapseButton({ isClicked, isClickedIndex, onClickCollapseButton }: CollapseButtonProps) {
  return isClicked && isClickedIndex ? (
    <span className={cls('weekday-exceed-in-week')} onClick={onClickCollapseButton}>
      <i className={cls('collapse-btn')} />
    </span>
  ) : null;
}

export function GridCell({
  width,
  left,
  index,
  exceedCount,
  isClicked,
  onClickExceedCount,
  isClickedIndex,
  onClickCollapseButton,
  isLastCell,
}: Props) {
  const {
    week: {
      dayGrid: { borderRight, backgroundColor },
    },
  } = useTheme();
  const style = {
    width,
    left,
    borderRight: isLastCell ? 'none' : borderRight,
    backgroundColor,
  };

  return (
    <div className={cls('panel-grid')} style={style}>
      <ExceedCount
        index={index}
        exceedCount={exceedCount}
        isClicked={isClicked}
        onClickExceedCount={onClickExceedCount}
      />
      <CollapseButton
        isClickedIndex={isClickedIndex}
        isClicked={isClicked}
        onClickCollapseButton={onClickCollapseButton}
      />
    </div>
  );
}