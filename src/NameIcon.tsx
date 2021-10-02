import { VFC, Suspense } from 'react';
import iconMaker from './iconMaker';

/**
 * Suspenceを使い、Canvasで生成した画像を表示するコンポーネント
 * canvas.convertToBlob()が非同期関数のため、描画した画像をそのまま埋め込むことができない
 */

const iconImage: { [key: string]: string } = {};
const IconMaker: VFC<{ userName: string }> = ({ userName }) => {
  const iconMakerWrapper = () => {
    if (!iconImage[userName]) {
      // eslint-disable-next-line no-return-assign
      throw iconMaker(userName).then((r) => (iconImage[userName] = r));
    } else {
      return iconImage[userName];
    }
  };

  return <img alt="icon" src={iconMakerWrapper()} />;
};

const NameIcon: VFC<{ userName: string }> = ({ userName }) => (
  <Suspense fallback={<p>Loading...</p>}>
    <IconMaker userName={userName} />
  </Suspense>
);

export default NameIcon;
